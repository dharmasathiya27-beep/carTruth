"""Premium HTML-to-PDF report generation using Playwright."""

from __future__ import annotations

import html
from collections import Counter
from datetime import date

from app.models.schemas import MOTRecord, VehicleReport


def _escape(value: object) -> str:
    if value is None:
        return "N/A"
    return html.escape(str(value))


def _format_date(value: date | None) -> str:
    if not value:
        return "N/A"
    return value.strftime("%d/%m/%Y")


def _format_money(value: int | None) -> str:
    return f"£{(value or 0):,}"


def _format_mileage(value: int | None) -> str:
    return f"{value:,} miles" if value else "N/A"


def _normalise_result(result: str) -> str:
    return "PASSED" if "PASS" in result.upper() else "FAILED"


def _issue_text(record: MOTRecord) -> str:
    parts = [
        *record.failures,
        *record.dangerousDefects,
        *record.majorDefects,
        *record.advisories,
        *record.minorDefects,
        *record.defects,
        *(item.text for item in record.classified_defects),
    ]
    return " ".join(parts)


def _issue_category(text: str) -> str:
    value = text.lower()
    if any(word in value for word in ["tyre", "tread", "sidewall", "wheel"]):
        return "Tyres"
    if any(word in value for word in ["brake", "braking", "disc", "pad", "handbrake"]):
        return "Brakes"
    if any(
        word in value for word in ["suspension", "shock", "spring", "strut", "bush", "ball joint"]
    ):
        return "Suspension"
    if any(word in value for word in ["corrosion", "corroded", "rust"]):
        return "Corrosion"
    if any(word in value for word in ["lamp", "light", "indicator", "electrical", "wiring"]):
        return "Lights/Electrical"
    if any(word in value for word in ["emission", "exhaust", "smoke", "lambda", "catalyst"]):
        return "Emissions"
    if any(word in value for word in ["steering", "track rod", "rack", "column"]):
        return "Steering"
    return "Other" if text.strip() else "No issues recorded"


def _mot_summary(report: VehicleReport) -> dict[str, object]:
    history = sorted(report.mot_history, key=lambda record: record.test_date, reverse=True)
    latest = history[0] if history else None
    pass_count = sum(1 for record in history if _normalise_result(record.result) == "PASSED")
    categories = Counter(_issue_category(_issue_text(record)) for record in history)
    categories.pop("No issues recorded", None)
    top_risks = [f"{category} ({count})" for category, count in categories.most_common(3)]

    return {
        "total": len(history),
        "pass_rate": round((pass_count / len(history)) * 100) if history else 0,
        "latest_result": _normalise_result(latest.result) if latest else "N/A",
        "latest_mileage": _format_mileage(latest.mileage if latest else None),
        "top_risks": top_risks or ["No recurring MOT risks detected"],
    }


def _mileage_summary(report: VehicleReport) -> str:
    history = sorted(report.mileage_history, key=lambda record: record.date)
    if not history:
        return "Mileage history unavailable from MOT records."

    first = history[0]
    latest = history[-1]
    total_added = latest.mileage - first.mileage
    return (
        f"Latest recorded mileage is {_format_mileage(latest.mileage)}. "
        f"Recorded mileage changed by {total_added:,} miles across {len(history)} readings."
    )


def _maintenance_warnings(report: VehicleReport) -> list[str]:
    warnings = report.mot_intelligence.maintenance_warnings[:4]
    if warnings:
        return warnings
    if report.mot_intelligence.future_concerns:
        return report.mot_intelligence.future_concerns[:4]
    return ["No major maintenance warning pattern detected from the available data."]


def render_pdf_report_html(report: VehicleReport) -> str:
    """Render a lightweight, branded HTML report for Playwright PDF output."""
    vehicle = report.vehicle
    score = report.ownership_score
    mot = _mot_summary(report)
    risk_badges = score.risk_badges[:5] or ["No major visible risk pattern"]

    top_risks_html = "".join(
        f"<span class='chip'>{_escape(risk)}</span>" for risk in mot["top_risks"]
    )
    warning_html = "".join(
        f"<li>{_escape(warning)}</li>" for warning in _maintenance_warnings(report)
    )
    badges_html = "".join(
        f"<span class='chip chip-muted'>{_escape(badge)}</span>" for badge in risk_badges
    )

    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CarTruth Report {_escape(vehicle.registration)}</title>
  <style>
    @page {{ size: A4; margin: 16mm; }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: #070b1f;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 13px;
      line-height: 1.45;
    }}
    .page {{
      min-height: 100vh;
      background:
        radial-gradient(circle at 85% 8%, rgba(59, 130, 246, 0.18), transparent 28%),
        linear-gradient(135deg, #050816 0%, #10172f 54%, #07111f 100%);
      padding: 28px;
    }}
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255,255,255,0.14);
      padding-bottom: 18px;
      margin-bottom: 22px;
    }}
    .brand {{ color: #93c5fd; font-size: 13px; font-weight: 800; letter-spacing: 0.22em; }}
    h1 {{ margin: 8px 0 0; font-size: 30px; line-height: 1.05; }}
    h2 {{ margin: 0 0 12px; font-size: 16px; }}
    .reg {{
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 0.14em;
    }}
    .grid {{ display: grid; gap: 14px; }}
    .grid-2 {{ grid-template-columns: 1fr 1fr; }}
    .grid-3 {{ grid-template-columns: repeat(3, 1fr); }}
    .card {{
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(15,23,42,0.76);
      border-radius: 14px;
      padding: 16px;
      break-inside: avoid;
    }}
    .label {{ color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; }}
    .value {{ margin-top: 4px; font-size: 21px; font-weight: 900; }}
    .score {{ font-size: 42px; font-weight: 950; }}
    .badge {{
      display: inline-block;
      border-radius: 999px;
      padding: 7px 10px;
      border: 1px solid rgba(125, 211, 252, 0.3);
      color: #bae6fd;
      background: rgba(14, 165, 233, 0.12);
      font-weight: 800;
    }}
    .chip {{
      display: inline-block;
      margin: 0 6px 6px 0;
      border-radius: 8px;
      padding: 7px 9px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.07);
      color: #e2e8f0;
      font-size: 12px;
      font-weight: 700;
    }}
    .chip-muted {{ color: #cbd5e1; }}
    .muted {{ color: #cbd5e1; }}
    ul {{ margin: 0; padding-left: 18px; }}
    li {{ margin: 0 0 7px; }}
    .section {{ margin-top: 14px; break-inside: avoid; }}
    .footer {{
      margin-top: 18px;
      border-top: 1px solid rgba(255,255,255,0.14);
      padding-top: 14px;
      color: #94a3b8;
      font-size: 11px;
    }}
  </style>
</head>
<body>
  <main class="page">
    <header class="header">
      <div>
        <div class="brand">CARTRUTH</div>
        <h1>{_escape(vehicle.make)} {_escape(vehicle.model)}</h1>
        <p class="muted">{_escape(vehicle.year)} • {_escape(vehicle.colour)} • {_escape(vehicle.fuel_type)}</p>
      </div>
      <div class="reg">{_escape(vehicle.registration)}</div>
    </header>

    <section class="grid grid-3">
      <div class="card">
        <div class="label">Ownership Score</div>
        <div class="score">{_escape(score.score)}<span class="muted" style="font-size:18px;">/100</span></div>
      </div>
      <div class="card">
        <div class="label">Verdict</div>
        <div class="value">{_escape(score.verdict)}</div>
        <p class="muted">{_escape(score.risk_level)} risk level</p>
      </div>
      <div class="card">
        <div class="label">Running Cost</div>
        <div class="value">{_format_money(score.yearly_running_cost or score.yearly_cost_estimate)}</div>
        <p class="muted">Estimated annual ownership cost</p>
      </div>
    </section>

    <section class="section card">
      <h2>CarTruth Summary</h2>
      <p>{_escape(score.should_buy_recommendation or score.ai_summary or score.score_explanation)}</p>
      <div>{badges_html}</div>
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <h2>MOT Overview</h2>
        <div class="grid grid-2">
          <p><span class="label">Tests</span><br><strong>{_escape(mot["total"])}</strong></p>
          <p><span class="label">Pass rate</span><br><strong>{_escape(mot["pass_rate"])}%</strong></p>
          <p><span class="label">Latest result</span><br><strong>{_escape(mot["latest_result"])}</strong></p>
          <p><span class="label">Latest mileage</span><br><strong>{_escape(mot["latest_mileage"])}</strong></p>
        </div>
      </div>
      <div class="card">
        <h2>Top MOT Risks</h2>
        {top_risks_html}
      </div>
    </section>

    <section class="section grid grid-2">
      <div class="card">
        <h2>Mileage Summary</h2>
        <p>{_escape(_mileage_summary(report))}</p>
      </div>
      <div class="card">
        <h2>Trust & Confidence</h2>
        <span class="badge">{_escape(report.confidence_level)} confidence</span>
        <p class="muted">Data source: {_escape(report.data_source)}. {_escape(score.data_basis)}</p>
      </div>
    </section>

    <section class="section card">
      <h2>Key Maintenance Warnings</h2>
      <ul>{warning_html}</ul>
    </section>

    <section class="section card">
      <h2>Official Vehicle Facts</h2>
      <div class="grid grid-3">
        <p><span class="label">Engine</span><br><strong>{_escape(vehicle.engine_capacity_cc or vehicle.engine_size)}</strong></p>
        <p><span class="label">Tax</span><br><strong>{_escape(vehicle.tax_status)}</strong></p>
        <p><span class="label">MOT</span><br><strong>{_escape(report.current_mot_status)}</strong></p>
        <p><span class="label">First registered</span><br><strong>{_escape(vehicle.month_of_first_registration)}</strong></p>
        <p><span class="label">CO2</span><br><strong>{_escape(vehicle.co2_emissions)}</strong></p>
        <p><span class="label">MOT expiry</span><br><strong>{_escape(_format_date(report.mot_valid_until))}</strong></p>
      </div>
    </section>

    <footer class="footer">
      Data provided by DVLA and DVSA where configured. CarTruth insights are estimates, not mechanical inspections.
    </footer>
  </main>
</body>
</html>"""


async def generate_vehicle_pdf(report: VehicleReport) -> bytes:
    """Convert the premium report HTML template into a PDF."""
    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise RuntimeError(
            "Playwright is not installed. Install backend requirements and run "
            "`python -m playwright install chromium`."
        ) from exc

    html_content = render_pdf_report_html(report)

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        try:
            page = await browser.new_page(viewport={"width": 794, "height": 1123})
            await page.set_content(html_content, wait_until="load")
            return await page.pdf(
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            )
        finally:
            await browser.close()
