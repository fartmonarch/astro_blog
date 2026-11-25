/**
 * 把文章里的 ```mermaid 代码块渲染成流程图。
 *
 * 为什么需要它：Astro 的 Markdown 渲染器只负责把围栏代码块变成 <pre><code>，
 * 不会执行 Mermaid 语法；编辑器（VS Code / Obsidian / Typora）能显示，
 * 是因为它们内置了 Mermaid 渲染器。这里在浏览器端补上这一步。
 *
 * 渲染时机：
 * - 首次加载（模块是 defer 的，执行时 DOM 已就绪）；
 * - View Transitions（ClientRouter）切换页面后，监听 astro:page-load 再跑一次；
 * - 明暗主题切换后，重渲染一遍，让图表的配色跟着变。
 *
 * mermaid 本体通过动态 import 加载：只有页面里真的存在 mermaid 代码块时，
 * 才会下载那几个体积很大的图表 chunk，普通页面不受影响。
 */

const BLOCK_SELECTOR = 'pre[data-language="mermaid"]';
const DIAGRAM_CLASS = "mermaid-diagram";
const FONT_FAMILY =
  '"Source Sans 3", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

type MermaidModule = typeof import("mermaid");

let mermaidPromise: Promise<MermaidModule> | null = null;
let currentTheme = "";
let rendering = false;
let rerenderQueued = false;

function loadMermaid(): Promise<MermaidModule> {
  // 失败时清掉缓存的 Promise，下次（例如切主题、换页面）还能重试
  mermaidPromise ??= import("mermaid").catch((error: unknown) => {
    mermaidPromise = null;
    throw error;
  });
  return mermaidPromise;
}

function themeName(): "dark" | "neutral" {
  return document.documentElement.classList.contains("dark") ? "dark" : "neutral";
}

/** 把还没处理过的 <pre data-language="mermaid"> 换成占位 div，并保留源码 */
function collectBlocks(): HTMLElement[] {
  const blocks = Array.from(document.querySelectorAll<HTMLElement>(BLOCK_SELECTOR));

  for (const block of blocks) {
    // Shiki 会把代码拆成一堆带颜色的 <span>，textContent 能还原出原始文本
    const source = (block.textContent ?? "").trim();
    if (!source) continue;

    const container = document.createElement("div");
    container.className = DIAGRAM_CLASS;
    container.dataset.source = source;
    block.replaceWith(container);
  }

  return Array.from(document.querySelectorAll<HTMLElement>(`.${DIAGRAM_CLASS}`));
}

async function renderDiagrams(): Promise<void> {
  if (rendering) {
    // 上一次还没画完（例如刚切主题又切回来），画完后再补一次
    rerenderQueued = true;
    return;
  }

  rendering = true;
  try {
    const nodes = collectBlocks();
    if (nodes.length === 0) return;

    const theme = themeName();
    const needsRender =
      theme !== currentTheme || nodes.some((node) => !node.hasAttribute("data-processed"));
    if (!needsRender) return;

    const { default: mermaid } = await loadMermaid();
    currentTheme = theme;

    mermaid.initialize({
      startOnLoad: false,
      // dark 用内置深色主题，light 用 neutral（比 default 更贴合本站的米色背景）
      theme,
      securityLevel: "strict",
      fontFamily: FONT_FAMILY,
      themeVariables: {
        fontFamily: FONT_FAMILY,
        // 让 SVG 背景透明，交给页面背景，避免深色模式下出现一块白底
        background: "transparent",
      },
    });

    for (const node of nodes) {
      const source = node.dataset.source ?? "";
      if (!source) continue;

      // mermaid 用 data-processed 跳过已处理的节点；重渲染前必须清掉
      node.removeAttribute("data-processed");
      node.classList.remove("mermaid-error");
      node.textContent = source;

      try {
        await mermaid.run({ nodes: [node] });
      } catch (error) {
        // 单张图语法错误不该影响整篇文章：把源码原样放回去，方便直接改
        console.error("[mermaid] 流程图渲染失败：", error);
        node.textContent = source;
        node.classList.add("mermaid-error");
      }
    }
  } catch (error) {
    console.error("[mermaid] 加载或初始化失败：", error);
  } finally {
    rendering = false;
    if (rerenderQueued) {
      rerenderQueued = false;
      void renderDiagrams();
    }
  }
}

function start(): void {
  void renderDiagrams();

  // ClientRouter 导航后 <pre> 是新的，需要再跑一遍
  document.addEventListener("astro:page-load", () => {
    void renderDiagrams();
  });

  // 主题开关只改 <html class="dark">，没有事件；用 MutationObserver 兜住
  new MutationObserver(() => {
    if (themeName() !== currentTheme) {
      void renderDiagrams();
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
}

start();
