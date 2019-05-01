import { html, DOMElement, mount } from "@hullo/dom";
import {
  map,
  state,
  combineLatest,
  interval,
  Observable,
  Atom
} from "@hullo/core";

const targetSize = 25;
const startTime = Date.now();

const rootElement = document.createElement("div");
document.body.appendChild(rootElement);
rootElement.title = "mount";
const stop = mount(rootElement, App());

function App() {
  return html.div({
    sync: "branch",
    style: {
      position: "absolute",
      transformOrigin: "0 0",
      left: "50%",
      top: "50%",
      width: "10px",
      height: "10px",
      background: "#eee",
      transform: endless().pipe(
        map(
          (): string => {
            const t = ((Date.now() - startTime) / 1000) % 10;
            const scale = 1 + (t > 5 ? 10 - t : t) / 10;
            return `scaleX(${scale / 2.5}) scaleY(0.7) translateZ(0.1px)`;
          }
        )
      )
    },
    children: SierpinskiTriangle({
      x: 0,
      y: 0,
      size: 1000,
      text: interval(1000)
        .pipe(map(t => Math.round(((t - startTime) / 1000) % 10).toString(10)))
        .pipe(state("0"))
    })
  });
}

function SierpinskiTriangle(props: {
  x: number;
  y: number;
  size: number;
  text: Observable<string>;
}): DOMElement[] {
  if (props.size <= targetSize) {
    return [
      Dot({
        x: props.x - targetSize / 2,
        y: props.y - targetSize / 2,
        size: targetSize,
        text: props.text
      })
    ];
  }
  return [
    ...SierpinskiTriangle({
      x: props.x,
      y: props.y - props.size / 4,
      size: props.size / 2,
      text: props.text
    }),
    ...SierpinskiTriangle({
      x: props.x - props.size / 2,
      y: props.y + props.size / 4,
      size: props.size / 2,
      text: props.text
    }),
    ...SierpinskiTriangle({
      x: props.x + props.size / 2,
      y: props.y + props.size / 4,
      size: props.size / 2,
      text: props.text
    })
  ];
}

function Dot(data: {
  x: number;
  y: number;
  size: number;
  text: Observable<string>;
}) {
  const hover$ = new Atom(false);

  return html.div({
    deref: () => {
      hover$.complete();
    },
    events: {
      mouseover: () => {
        hover$.next(true);
      },
      mouseout: () => {
        hover$.next(false);
      }
    },
    style: {
      position: "absolute",
      font: "normal 15px sans-serif",
      textAlign: "center",
      cursor: "pointer",
      width: `${data.size}px`,
      height: `${data.size}px`,
      left: `${data.x}px`,
      top: `${data.y}px`,
      borderRadius: `${data.size / 2}px`,
      lineHeight: `${data.size}px`,
      background: hover$.pipe(map(hover => (hover ? "#ff0" : "#61dafb")))
    },
    props: {
      innerText: combineLatest<[boolean, string]>([hover$, data.text]).pipe(
        map(([hover = false, text = ""]) => (hover ? `*${text}*` : text))
      )
    }
  });
}

function endless() {
  return new Observable<void>(observer => {
    let closed = false;
    function send() {
      if (closed) {
        return;
      }
      observer.next().then(send);
    }
    send();
    return () => {
      closed = true;
    };
  });
}

declare global {
  interface NodeModule {
    hot: any;
  }
}

if ("hot" in module && module.hot) {
  module.hot.dispose(() => {
    document.body.removeChild(rootElement);
    stop();
  });
}
