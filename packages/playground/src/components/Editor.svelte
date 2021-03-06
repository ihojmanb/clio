<script>
  export let title;
  export let share = false;
  export let query = "";

  import FontFaceObserver from "fontfaceobserver";

  const font = new FontFaceObserver("Fira Code");

  import { clio, loadMonaco, pastelsOnDark } from "../monaco";
  import run from "../clio/run";

  import { compile } from "clio-core";
  import inspect from "object-inspect";

  const samples = {
    parallelFib() {
      return [
        "fn fib n:",
        "  if n < 2: n",
        "  else: (fib n - 1)",
        "      + (fib n - 2)",
        "",
        "export fn main argv:",
        "  [39 40 41 42]",
        "    -> * await |fib|",
        "    -> * item: console.log item",
      ].join("\n");
    },
    fib() {
      return [
        "fn fib n:",
        "  if n < 2: n",
        "  else: (fib n - 1)",
        "      + (fib n - 2)",
        "",
        "export fn main argv:",
        "  [39 40 41 42]",
        "    -> * fib",
        "    -> * item: console.log item",
      ].join("\n");
    },
    express() {
      return [
        "-- Note: this code doesn't run in the browser!",
        'import "express"',
        "",
        "fn hello req res:",
        '  "Hello world" -> res.send',
        "",
        "export fn main argv:",
        "  express () ->",
        '    .get "/" hello',
        "    .listen 3000",
      ].join("\n");
    },
  };

  function getCode() {
    if (query) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get(query);
      return code ? decodeURIComponent(code) : samples.parallelFib();
    }
    return samples.parallelFib();
  }

  let editor;
  let domConsole;

  const setSampleCode = (event) => {
    const { value } = event.target || "parallelFib";
    const code = samples[value]();
    editor.setValue(code);
  };

  let isActive = false;

  const showMessage = () => {
    isActive = true;
    setTimeout(() => (isActive = false), 4000);
  };

  const copyShareURL = (event) => {
    event.preventDefault();
    const code = editor.getValue();
    const encoded = encodeURIComponent(code);
    const { origin, pathname } = window.location;
    const url = `${origin}${pathname}?${query}=${encoded}`;
    navigator.clipboard.writeText(url);
    showMessage();
  };

  const compileAndRun = (event) => {
    event.preventDefault();
    (async () => {
      const lines = [];
      console.log = async (...args) => {
        lines.push(args.map(inspect).join(" "));
        domConsole.setValue(lines.join("\n"));
      };
      console.error = console.log;
      try {
        const src = editor.getValue();
        const { code } = compile(src, "main.clio");
        const main = await run(code);
        const now = performance.now();
        await main();
        const end = performance.now();
        const time = `Took ${Math.round((end - now) * 100) / 100}ms`;
        lines.push("-".repeat(time));
        lines.push(time);
        domConsole.setValue(lines.join("\n"));
      } catch (error) {
        console.error(error);
      }
    })();
  };

  const makeEditor = async () => {
    const monaco = window.monaco || (await loadMonaco());
    monaco.languages.register({ id: "clio" });
    monaco.languages.setMonarchTokensProvider("clio", clio);
    monaco.editor.defineTheme("PastelsOnDark", pastelsOnDark);
    monaco.editor.setTheme("PastelsOnDark");
    editor = monaco.editor.create(document.getElementById("left-pane"), {
      value: getCode(),
      language: "clio",
      fontFamily: "Fira Code",
      fontLigatures: true,
      fontSize: 16,
    });
    domConsole = monaco.editor.create(document.getElementById("right-pane"), {
      value: "",
      language: "javascript",
      fontFamily: "Fira Code",
      fontLigatures: true,
      fontSize: 16,
      readOnly: true,
    });
  };

  font.load().then(makeEditor);
</script>

<style>
  .container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;
  }
  .toolbar {
    height: 64px;
    padding: 1em;
    box-sizing: border-box;
    background: #211e1e;
    box-shadow: 0px 0px 32px 8px rgba(0, 0, 0, 0.4);
    color: #dadada;
    z-index: 1000;
    display: flex;
    align-items: center;
  }
  .btn,
  .sample {
    color: #dadada;
    text-decoration: none;
    border-radius: 6px;
    border: 2px solid #333;
    padding: 0.5em 1em;
    background: transparent;
  }
  .sample {
    font-size: 0.95em;
    margin-right: 1em;
    outline: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    padding: 0.55em 1em;
    margin-bottom: -0.15em;
  }
  .share {
    margin-right: 1em;
  }
  .sep {
    height: 1em;
    box-sizing: border-box;
    background: #211e1e;
    z-index: 999;
  }
  .spacer {
    flex: 1;
  }
  .editor {
    background: #211e1e;
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .editor > div {
    flex: 1;
  }
  .logo {
    zoom: 0.25;
    margin-right: 64px;
  }
  .copied {
    position: absolute;
    padding: 1em;
    border-radius: 4px;
    box-shadow: 0px 0px 32px 8px rgba(0, 0, 0, 0.4);
    bottom: -10em;
    left: 50%;
    transform: translateX(-50%);
    width: auto;
    z-index: 1000;
    background: #211e1e;
    color: #dadada !important;
  }
  @keyframes appear {
    0% {
      bottom: -10em;
    }
    10% {
      bottom: 1em;
    }
    70% {
      bottom: 1em;
    }
    100% {
      bottom: -10em;
    }
  }
  .copied.isActive {
    animation: appear 4s ease-in forwards;
  }
</style>

<div class="container">
  <div class="toolbar">
    <img src="/logo-128x128.png" class="logo" alt="logo" />
    <span class="title">{title}</span>
    <div class="spacer" />
    <select class="sample" on:change={setSampleCode}>
      <option selected value="parallelFib">Parallel Fib</option>
      <option value="fib">Fib</option>
      <option value="express">Express</option>
    </select>
    {#if share}
      <a href="#?" class="btn share" on:click={copyShareURL}> Share </a>
    {/if}
    <a href="#?" class="btn" on:click={compileAndRun}> Run </a>
  </div>
  <div class="sep" />
  <div class="editor">
    <div id="left-pane" />
    <div id="right-pane" />
  </div>
  <div class="copied" class:isActive>Link copied to clipboard</div>
</div>
