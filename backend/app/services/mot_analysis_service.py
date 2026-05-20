"""MOT advisory classification and risk summarisation."""

from collections import Counter, defaultdict

from app.models.mot_schema import NormalizedMOTRecord
from app.models.schemas import MOTAdvisory, MOTIntelligence, MOTRecord

CATEGORY_KEYWORDS = {
    "Tyres": ["tyre", "tire", "tread", "sidewall", "nail"],
    "Brakes": ["brake", "disc", "pad", "caliper", "servo", "abs"],
    "Suspension": ["suspension", "spring", "shock", "strut", "arm", "bush", "ball joint"],
    "Corrosion": ["corrosion", "corroded", "rust", "structural"],
    "Electrical": ["lamp", "light", "bulb", "indicator", "battery", "wiring", "electrical"],
    "Engine": ["engine", "oil level", "misfire", "coolant", "timing", "exhaust"],
    "Emissions": ["emission", "smoke", "lambda", "catalyst", "exhaust gas"],
    "Steering": ["steering", "rack", "track rod", "power steering"],
    "Visibility": ["windscreen", "wiper", "washer", "mirror", "visibility"],
    "Fluid leaks": ["leak", "fluid", "oil leak", "coolant leak", "fuel leak"],
}

SEVERITY_KEYWORDS = {
    "Critical": [
        "dangerous",
        "do not drive",
        "structural corrosion",
        "brake disc thickness below minimum",
        "cord exposed",
        "fuel leak",
    ],
    "High": [
        "failed",
        "excessive",
        "below minimum",
        "seriously weakened",
        "major",
        "insecure",
        "leak",
        "emissions exceed",
    ],
    "Medium": [
        "worn",
        "wearing thin",
        "close to legal limit",
        "deteriorated",
        "corroded",
        "play",
        "imbalanced",
    ],
    "Low": [
        "advisory",
        "slight",
        "minor",
        "monitor",
        "surface corrosion",
        "perished",
    ],
}

SEVERITY_RANK = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}


def classify_advisory(advisory: str) -> str:
    """Return the best-fit category for a MOT advisory/failure string."""
    text = advisory.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return category
    return "Engine"


def calculate_issue_severity(advisory: str, test_result: str = "PASSED") -> str:
    """Classify severity using keywords and whether the MOT record failed."""
    text = advisory.lower()
    for severity in ("Critical", "High", "Medium", "Low"):
        if any(keyword in text for keyword in SEVERITY_KEYWORDS[severity]):
            return severity
    return "High" if test_result == "FAILED" else "Low"


def _all_mot_items(record: NormalizedMOTRecord) -> list[str]:
    return [
        *record.advisories,
        *record.failures,
        *record.dangerousDefects,
        *record.majorDefects,
        *record.minorDefects,
    ]


def detect_repeated_issues(mot_history: list[NormalizedMOTRecord]) -> list[str]:
    """Return categories that occur in more than one MOT record."""
    category_years: dict[str, set[int]] = defaultdict(set)
    for record in mot_history:
        for defect in _all_mot_items(record):
            category_years[classify_advisory(defect)].add(record.testDate.year)

    return sorted(category for category, years in category_years.items() if len(years) >= 2)


def _item_severity(record: NormalizedMOTRecord, item: str) -> str:
    if item in record.dangerousDefects:
        return "Critical"
    if item in record.majorDefects or item in record.failures:
        return calculate_issue_severity(item, "FAILED")
    if item in record.minorDefects:
        return "Low"
    return calculate_issue_severity(item, record.result)


def _classified_records(
    mot_history: list[NormalizedMOTRecord], repeated_categories: list[str]
) -> list[list[MOTAdvisory]]:
    repeated_set = set(repeated_categories)
    records: list[list[MOTAdvisory]] = []

    for record in mot_history:
        classified = [
            MOTAdvisory(
                text=defect,
                category=classify_advisory(defect),
                severity=_item_severity(record, defect),
                is_repeated=classify_advisory(defect) in repeated_set,
            )
            for defect in _all_mot_items(record)
        ]
        records.append(classified)

    return records


def enrich_mot_history(
    report_history: list[MOTRecord],
    normalised_history: list[NormalizedMOTRecord],
) -> list[MOTRecord]:
    """Attach classified advisory objects to each public MOT record."""
    classified_records = _classified_records(
        normalised_history, detect_repeated_issues(normalised_history)
    )
    return [
        record.model_copy(update={"classified_defects": classified_records[index]})
        for index, record in enumerate(report_history)
    ]


def summarise_mot_risks(mot_history: list[NormalizedMOTRecord]) -> MOTIntelligence:
    """Summarise repeated MOT risks, severity, and future maintenance concerns."""
    repeated = detect_repeated_issues(mot_history)
    classified = [
        item
        for classified_record in _classified_records(mot_history, repeated)
        for item in classified_record
    ]

    if not classified:
        return MOTIntelligence(
            summary="No MOT advisories or failures found in the available history.",
            highest_risk_category="None",
            highest_severity="Low",
        )

    category_counts = Counter(item.category for item in classified)
    severity_counts = Counter(item.severity for item in classified)
    highest = max(classified, key=lambda item: SEVERITY_RANK[item.severity])
    highest_category = category_counts.most_common(1)[0][0]

    warnings: list[str] = []
    concerns: list[str] = []

    for category in repeated:
        warnings.append(f"Repeated {category.lower()} issues appear across multiple MOT years.")

    if any(item.severity in {"High", "Critical"} for item in classified):
        warnings.append("High-severity MOT items have appeared in the vehicle history.")

    if "Brakes" in category_counts:
        concerns.append("Brake components may need closer inspection and budgeting.")
    if "Tyres" in category_counts:
        concerns.append("Tyre wear pattern should be checked for alignment or suspension causes.")
    if "Suspension" in category_counts:
        concerns.append("Suspension wear could affect ride quality and future repair cost.")
    if "Corrosion" in category_counts:
        concerns.append("Corrosion should be inspected physically, especially on older vehicles.")
    if "Fluid leaks" in category_counts:
        concerns.append("Fluid leak notes can indicate developing engine or drivetrain repairs.")
    if not concerns:
        concerns.append("Continue monitoring routine wear items at the next MOT.")

    return MOTIntelligence(
        repeated_issues=repeated,
        highest_risk_category=highest_category,
        highest_severity=highest.severity,
        maintenance_warnings=warnings or ["No repeated high-risk MOT patterns detected."],
        future_concerns=concerns,
        category_counts=dict(category_counts),
        severity_counts=dict(severity_counts),
        summary=(
            f"{len(classified)} MOT item(s) classified. Highest risk area is "
            f"{highest_category} with {highest.severity.lower()} severity."
        ),
    )
