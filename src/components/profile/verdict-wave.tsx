import { CATEGORY_LABEL, type TasteWaveCategoryMetric } from "@/lib/domain";

const WAVE_WIDTH = 980;
const WAVE_HEIGHT = 74;
const WAVE_LEFT = 14;
const WAVE_RIGHT = WAVE_WIDTH - 18;

type WaveTone = "positive" | "neutral" | "warning" | "quiet";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function ratio(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return part / total;
}

function getTone(metric: TasteWaveCategoryMetric): WaveTone {
  if (metric.total === 0) {
    return "quiet";
  }
  if (metric.avgVerdictScore === null) {
    return "neutral";
  }
  if (metric.avgVerdictScore >= 4) {
    return "positive";
  }
  if (metric.avgVerdictScore <= 2.4) {
    return "warning";
  }
  return "neutral";
}

function getSignalLabel(metric: TasteWaveCategoryMetric): string {
  if (metric.total === 0) {
    return "currently quiet";
  }
  if (metric.avgVerdictScore === null) {
    return "unrated signal";
  }
  if (metric.avgVerdictScore >= 4.4) {
    return "strong fit";
  }
  if (metric.avgVerdictScore >= 3.7) {
    return "rising fit";
  }
  if (metric.avgVerdictScore <= 2.2) {
    return "rough patch";
  }
  return "mixed but alive";
}

function buildWave(metric: TasteWaveCategoryMetric): {
  path: string;
  ghostPath: string;
  endY: number;
} {
  const mid = WAVE_HEIGHT / 2;
  const quality = metric.avgVerdictScore ? (metric.avgVerdictScore - 1) / 4 : 0.5;
  const completion = ratio(metric.finished, metric.total);
  const inProgress = ratio(metric.started, metric.total);
  const dropped = ratio(metric.dropped, metric.total);
  const starred = ratio(metric.starred, metric.total);

  const amplitude = 8 + completion * 8 + starred * 7 + Math.max(quality - 0.5, 0) * 6;
  const turbulence = 0.26 + dropped * 0.82 + Math.max(0.55 - quality, 0) * 0.35;
  const incline = (quality - 0.5) * 18 + (completion - dropped) * 10;

  const x1 = WAVE_WIDTH * 0.2;
  const x2 = WAVE_WIDTH * 0.36;
  const x3 = WAVE_WIDTH * 0.58;
  const x4 = WAVE_WIDTH * 0.74;
  const x5 = WAVE_WIDTH * 0.88;

  const startY = clamp(mid + (0.5 - quality) * 9, 8, WAVE_HEIGHT - 8);
  const y1 = clamp(mid - amplitude * (0.66 + inProgress * 0.36), 8, WAVE_HEIGHT - 8);
  const y2 = clamp(mid + amplitude * (turbulence + 0.08), 8, WAVE_HEIGHT - 8);
  const y3 = clamp(mid - amplitude * (0.44 + starred * 0.42), 8, WAVE_HEIGHT - 8);
  const endY = clamp(mid - incline, 8, WAVE_HEIGHT - 8);

  const path = [
    `M ${WAVE_LEFT} ${startY}`,
    `C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${mid}`,
    `C ${x4} ${y3}, ${x5} ${endY}, ${WAVE_RIGHT} ${endY}`,
  ].join(" ");

  const ghostPath = [
    `M ${WAVE_LEFT} ${mid}`,
    `C ${x1} ${mid}, ${x2} ${mid}, ${x3} ${mid}`,
    `C ${x4} ${mid}, ${x5} ${mid}, ${WAVE_RIGHT} ${mid}`,
  ].join(" ");

  return { path, ghostPath, endY };
}

export function VerdictWave({
  metrics,
}: {
  metrics: TasteWaveCategoryMetric[];
}): JSX.Element {
  return (
    <section className="card wave-card">
      <header className="wave-header">
        <h2>Verdict wave</h2>
        <p className="muted">Left is older signal, right is where your taste sits now.</p>
      </header>

      <ul className="wave-list">
        {metrics.map((metric, index) => {
          const tone = getTone(metric);
          const wave = buildWave(metric);
          const ratingText =
            metric.avgVerdictScore === null ? "No ratings yet" : `Avg ${metric.avgVerdictScore.toFixed(1)} / 5`;
          const statusText =
            metric.total === 0
              ? "No items yet"
              : `${metric.total} items · ${metric.finished} finished · ${metric.started} started`;

          return (
            <li className={`wave-row wave-row-${tone}`} key={metric.category}>
              <div className="wave-row-head">
                <div>
                  <p className="wave-row-category">{CATEGORY_LABEL[metric.category]}</p>
                  <p className="wave-row-meta">{statusText}</p>
                </div>
                <div className="wave-row-right">
                  <p className="wave-row-rating">{ratingText}</p>
                  <p className="wave-row-signal">{getSignalLabel(metric)}</p>
                </div>
              </div>
              <div className="wave-track">
                <svg
                  className="wave-svg"
                  viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={`${CATEGORY_LABEL[metric.category]} verdict wave`}
                >
                  <line
                    className="wave-baseline"
                    x1={WAVE_LEFT}
                    y1={WAVE_HEIGHT / 2}
                    x2={WAVE_RIGHT}
                    y2={WAVE_HEIGHT / 2}
                  />
                  <path className="wave-ghost" d={wave.ghostPath} />
                  <path
                    className={`wave-path wave-path-${tone}`}
                    d={wave.path}
                    style={{ animationDelay: `${index * 45}ms` }}
                  />
                  <circle
                    className={`wave-dot wave-dot-${tone}`}
                    cx={WAVE_RIGHT}
                    cy={wave.endY}
                    r={4.8}
                  />
                </svg>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
