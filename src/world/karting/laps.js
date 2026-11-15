// Signed distance in the direction of travel. The intersection must lie
// inside the physical timing segment, including for a frame that spans it.
function gate(a, b, forward) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const sign = Math.sign(dx * forward[1] - dz * forward[0]);
  const lengthSq = dx * dx + dz * dz;
  return (previous, current) => {
    const side = p => sign * (dx * (p.z - a[1]) - dz * (p.x - a[0]));
    const from = side(previous), to = side(current);
    if ((from < 0) === (to < 0)) return null;
    const fraction = from / (from - to);
    const x = previous.x + fraction * (current.x - previous.x);
    const z = previous.z + fraction * (current.z - previous.z);
    const across = ((x - a[0]) * dx + (z - a[1]) * dz) / lengthSq;
    if (across < 0 || across > 1) return null;
    return { fraction, forward: from < to };
  };
}

export function createLapTimer(course) {
  const finish = gate(...course.startFinish, [0, 1]);
  // Require the three sectors in order so a turn-around at the line or a
  // short cut across the infield cannot count as a completed clockwise lap.
  const markers = [.25, .50, .75].map(u => {
    const p = course.racingLine.getPointAt(u), t = course.racingLine.getTangentAt(u);
    return gate([p.x - t.z * 4.8, p.z + t.x * 4.8], [p.x + t.z * 4.8, p.z - t.x * 4.8], [t.x, t.z]);
  });
  const look = course.racingLine.getSpacedPoints(84);
  const view = { visible: false, elapsed: null, last: null, best: null };
  let previous, started, next;
  function reset() {
    previous = null;
    started = null;
    next = 0;
    view.visible = false;
    view.elapsed = null;
  }
  reset();
  return {
    view,
    update(car, time) {
      if (!car || !look.some(p => (car.x - p.x) ** 2 + (car.z - p.z) ** 2 <= 45 ** 2)) {
        reset();
        return;
      }
      const current = { car, poseRevision: car.poseRevision, x: car.x, z: car.z, time };
      if (previous && (previous.car !== car || previous.poseRevision !== car.poseRevision || time < previous.time)) reset();
      view.visible = true;
      if (previous) {
        const hit = finish(previous, current);
        if (hit) {
          const at = previous.time + hit.fraction * (time - previous.time);
          if (hit.forward && started !== null && next === markers.length) {
            view.last = at - started;
            view.best = view.best === null ? view.last : Math.min(view.best, view.last);
          }
          started = hit.forward ? at : null;
          next = 0;
        } else if (started !== null && next < markers.length && markers[next](previous, current)?.forward) {
          next += 1;
        }
      }
      view.elapsed = started === null ? null : time - started;
      previous = current;
    },
  };
}

function formatTime(time) {
  const millis = Math.floor(time * 1000);
  const seconds = Math.floor(millis / 1000) % 60;
  return Math.floor(millis / 60000) + ':' + String(seconds).padStart(2, '0') + '.' + String(millis % 1000).padStart(3, '0');
}

export function mountLapTimer(ctx, course) {
  if (typeof document === 'undefined' || !document.head || ctx.recordBake) return;
  const timer = createLapTimer(course);
  const style = document.createElement('style');
  style.textContent = `
    #kart-laps { position: fixed; top: calc(66px + env(safe-area-inset-top)); left: 50%;
      transform: translateX(-50%); z-index: 8; background: #111b2bdc; color: #fff;
      border-radius: 10px; padding: 8px 14px; text-align: center; pointer-events: none;
      font: 600 13px/1.45 system-ui, sans-serif; white-space: nowrap; }
    #kart-laps strong { display: block; font-size: 22px; font-variant-numeric: tabular-nums; }
    body.noui #kart-laps, body.shot #kart-laps { display: none; }
    @media (max-width: 550px) { #kart-laps { top: calc(55px + env(safe-area-inset-top)); } }
  `;
  const root = document.createElement('section');
  root.id = 'kart-laps';
  root.hidden = true;
  root.setAttribute('aria-label', 'Хронометраж круга');
  const current = document.createElement('strong'), results = document.createElement('div');
  root.appendChild(current);
  root.appendChild(results);
  document.head.appendChild(style);
  document.body.appendChild(root);

  ctx.onUpdate((_dt, time) => {
    const drive = ctx.drive;
    timer.update(drive?.active && drive.vehicle.kind === 'kart' ? drive.car : null, time);
    const { visible, elapsed, last, best } = timer.view;
    if (root.hidden === visible) root.hidden = !visible;
    if (!visible) return;
    const text = elapsed === null ? 'Пересеки старт-финиш' : formatTime(elapsed);
    if (current.textContent !== text) current.textContent = text;
    const laps = last === null ? '' : 'Последний ' + formatTime(last) + ' · Лучший ' + formatTime(best);
    if (results.textContent !== laps) results.textContent = laps;
  });
}
