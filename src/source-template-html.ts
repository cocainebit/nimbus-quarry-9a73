import { zipSync, strToU8 } from "fflate";
import type { Project } from "./model";
import {
  editableStyleProperties,
  validElementStyle,
  templateFontCss,
  usedTemplateFonts,
} from "./template-typography";
export type NativeElement = {
  id: string;
  tag: string;
  text: string;
  href?: string;
  src?: string;
  alt?: string;
  canText: boolean;
};
export type SourceTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  sourceUrl: string;
  license: string;
  entry: string;
  pages: string[];
  files: string[];
  collection?: string;
  adaptationLabel?: string;
};
export function validTemplateUrl(value: string, image = false) {
  if (!value || /[\u0000-\u0020<>"'\\]/.test(value)) return false;
  if (/^(https?:\/\/|#)/i.test(value)) return true;
  if (!image && /^(mailto:|tel:)/i.test(value)) return true;
  return (
    !/^[a-z][a-z0-9+.-]*:/i.test(value) &&
    !value.startsWith("//") &&
    !value.split(/[/?#]/).includes("..")
  );
}
function plainTextElement(el: Element) {
  return Array.from(el.children).every((child) => child.tagName === "BR");
}
function plainText(el: Element) {
  return Array.from(el.childNodes)
    .map((node) =>
      node instanceof Element && node.tagName === "BR"
        ? "\n"
        : node.textContent || "",
    )
    .join("");
}
function setPlainText(el: Element, value: string) {
  const lines = value.split("\n");
  el.replaceChildren(
    ...lines.flatMap((line, i) =>
      i
        ? [
            el.ownerDocument.createElement("br"),
            el.ownerDocument.createTextNode(line),
          ]
        : [el.ownerDocument.createTextNode(line)],
    ),
  );
}
function editable(el: Element) {
  if (el.closest("script,style,noscript,svg,head")) return false;
  if (
    /html5\s*up|start\s*bootstrap|creative commons|creativecommons|html5up\.net|startbootstrap\.com/i.test(
      el.textContent || "",
    )
  )
    return false;
  if (
    el.closest(
      'a[href*="html5up.net"],a[href*="startbootstrap.com"],a[href*="creativecommons.org"]',
    )
  )
    return false;
  return (
    el.tagName === "IMG" ||
    el.tagName === "A" ||
    (plainTextElement(el) && Boolean(el.textContent?.trim()))
  );
}
function serialize(doc: Document) {
  return Array.from(doc.childNodes)
    .map((node) =>
      node.nodeType === Node.DOCUMENT_TYPE_NODE
        ? "<!doctype html>"
        : node.nodeType === Node.COMMENT_NODE
          ? `<!--${node.textContent}-->`
          : node instanceof Element
            ? node.outerHTML
            : node.textContent || "",
    )
    .join("\n");
}
function elements(doc: Document) {
  const existing = Array.from(
    doc.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,p,span,a,button,li,label,dt,dd,img",
    ),
  ).filter(
    (el) =>
      editable(el) &&
      (el.tagName === "IMG" || el.tagName === "A" || el.children.length === 0),
  );
  // Append newly supported text containers so saved element-N references from
  // earlier editor versions continue to identify the same original elements.
  const known = new Set(existing);
  const additional = Array.from(
    doc.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,p,span,a,button,li,label,dt,dd,div,em,strong",
    ),
  ).filter((el) => !known.has(el) && editable(el) && plainTextElement(el));
  return [...existing, ...additional];
}

function stableSelector(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.tagName !== "HTML") {
    const tag = node.tagName.toLowerCase();
    const siblings = node.parentElement
      ? Array.from(node.parentElement.children).filter(
          (sibling) => sibling.tagName === node!.tagName,
        )
      : [node];
    parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(node) + 1})`);
    node = node.parentElement;
  }
  return parts.join(" > ");
}
export function editTemplateDocument(
  html: string,
  page: string,
  edits: Record<string, string>,
  customCss = "",
  fontBase = new URL("/templates/_plotform-fonts/", location.origin).href,
) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const nodes = elements(doc);
  const reactRuntime = Boolean(doc.querySelector('script[src*="_next/"]'));
  const runtimePatches: {
    selector: string;
    id: string;
    text?: string;
    attributes: Record<string, string | null>;
    styles: Record<string, string>;
  }[] = [];
  const listed: NativeElement[] = nodes.map((el, i) => {
    const id = `element-${i}`,
      prefix = `${page}::${id}::`,
      canText = plainTextElement(el) && el.tagName !== "IMG";
    const selector = stableSelector(el),
      original = el.cloneNode(true) as Element;
    if (canText && edits[prefix + "text"] !== undefined)
      setPlainText(el, edits[prefix + "text"]);
    if (
      el.tagName === "A" &&
      edits[prefix + "href"] !== undefined &&
      validTemplateUrl(edits[prefix + "href"])
    )
      el.setAttribute("href", edits[prefix + "href"]);
    if (el.tagName === "A" && edits[prefix + "href"] === "")
      el.removeAttribute("href");
    if (el.tagName === "IMG") {
      if (
        edits[prefix + "src"] !== undefined &&
        validTemplateUrl(edits[prefix + "src"], true)
      ) {
        el.setAttribute("src", edits[prefix + "src"]);
        el.removeAttribute("srcset");
        el.removeAttribute("sizes");
        el.closest("picture")
          ?.querySelectorAll("source")
          .forEach((source) => source.remove());
      }
      if (edits[prefix + "alt"] !== undefined)
        el.setAttribute("alt", edits[prefix + "alt"]);
    }
    const styles: Record<string, string> = {};
    if (canText)
      for (const key of editableStyleProperties) {
        const value = edits[prefix + "style." + key];
        if (value && validElementStyle(key, value)) {
          styles[key] = value;
          (el as HTMLElement).style.setProperty(key, value, "important");
        }
      }
    el.setAttribute("data-studio-edit", id);
    const listedElement = {
      id,
      tag: el.tagName.toLowerCase(),
      text: plainText(el).trim(),
      canText,
      ...(el.tagName === "A" ? { href: el.getAttribute("href") || "" } : {}),
      ...(el.tagName === "IMG"
        ? {
            src: el.getAttribute("src") || "",
            alt: el.getAttribute("alt") || "",
          }
        : {}),
    };
    if (reactRuntime) {
      const attributes: Record<string, string | null> = {};
      for (const key of ["href", "src", "alt", "srcset", "sizes"]) {
        if (el.getAttribute(key) !== original.getAttribute(key))
          attributes[key] = el.getAttribute(key);
      }
      runtimePatches.push({
        selector,
        id,
        ...(canText && plainText(el) !== plainText(original)
          ? { text: plainText(el) }
          : {}),
        attributes,
        styles,
      });
      // Hydrate the untouched server markup first. Editing it before hydration
      // would make React discard the server DOM and the editor's selections.
      if (canText)
        el.replaceChildren(
          ...Array.from(original.childNodes).map((node) =>
            node.cloneNode(true),
          ),
        );
      for (const key of ["href", "src", "alt", "srcset", "sizes"]) {
        const value = original.getAttribute(key);
        if (value === null) el.removeAttribute(key);
        else el.setAttribute(key, value);
      }
      const originalStyle = original.getAttribute("style");
      if (originalStyle === null) el.removeAttribute("style");
      else el.setAttribute("style", originalStyle);
      el.removeAttribute("data-studio-edit");
    }
    return listedElement;
  });
  if (reactRuntime) {
    const script = doc.createElement("script");
    script.setAttribute("data-plotform-runtime-edits", "");
    const payload = JSON.stringify(runtimePatches).replace(/</g, "\\u003c");
    script.textContent = `(function(){var patches=${payload};var observer,queued=false;function apply(){queued=false;if(observer)observer.disconnect();var editing=!!document.querySelector('style[data-studio-controls]');patches.forEach(function(p){var el=document.querySelector(p.selector);if(!el)return;if(editing&&el.getAttribute('data-studio-edit')!==p.id)el.setAttribute('data-studio-edit',p.id);if(p.text!==undefined&&Array.from(el.childNodes).map(function(n){return n.nodeName==='BR'?'\\n':n.textContent||''}).join('')!==p.text){var lines=p.text.split('\\n');el.replaceChildren.apply(el,lines.flatMap(function(line,i){return i?[document.createElement('br'),document.createTextNode(line)]:[document.createTextNode(line)]}));}Object.keys(p.styles||{}).forEach(function(k){if(el.style.getPropertyValue(k)!==p.styles[k]||el.style.getPropertyPriority(k)!=='important')el.style.setProperty(k,p.styles[k],'important');});Object.keys(p.attributes).forEach(function(k){var v=p.attributes[k];if(v===null){if(el.hasAttribute(k))el.removeAttribute(k);}else if(el.getAttribute(k)!==v)el.setAttribute(k,v);});});if(observer)observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['href','src','alt','srcset','sizes','style','data-studio-edit']});}function queue(){if(!queued){queued=true;requestAnimationFrame(apply);}}function start(){observer=new MutationObserver(queue);apply();setTimeout(apply,1000);setTimeout(apply,3000);}if(document.readyState==='complete')setTimeout(start,350);else window.addEventListener('load',function(){setTimeout(start,350);},{once:true});})();`;
    doc.body.append(script);
  }
  const fontCss = templateFontCss(edits, fontBase);
  if (fontCss) {
    const style = doc.createElement("style");
    style.textContent = fontCss;
    doc.head.append(style);
  }
  if (customCss) {
    const style = doc.createElement("style");
    style.setAttribute("data-plotform-custom", "");
    style.textContent = customCss.replace(/<\/style/gi, "<\\/style");
    doc.head.append(style);
  }
  return { doc, elements: listed };
}
export function templatePreview(
  html: string,
  page: string,
  edits: Record<string, string>,
  base: string,
  nonce: string,
  customCss = "",
) {
  const result = editTemplateDocument(html, page, edits, customCss),
    { doc } = result;
  doc
    .querySelectorAll("script[src]")
    .forEach((script) => script.setAttribute("crossorigin", "anonymous"));
  const originalBase = doc.querySelector("base")?.getAttribute("href");
  if (originalBase) base = new URL(originalBase, base).href;
  doc.querySelectorAll("base").forEach((el) => el.remove());
  const b = doc.createElement("base");
  b.href = base;
  doc.head.prepend(b);
  const style = doc.createElement("style");
  style.setAttribute("data-studio-controls", "");
  style.textContent =
    "[data-studio-edit]{cursor:crosshair!important}[data-studio-edit]:hover{outline:2px dashed #6e56cf!important;outline-offset:3px}";
  doc.head.append(style);
  const script = doc.createElement("script");
  script.textContent = `if(location.protocol==='about:'){['pushState','replaceState'].forEach(function(method){var original=history[method].bind(history);history[method]=function(state,title,url){try{return original(state,title,url)}catch(error){if(error.name!=='SecurityError')throw error;return original(state,title)}}})}var studioEditing=true;window.addEventListener('hashchange',function(){parent.postMessage({type:'studio-template-location',nonce:${JSON.stringify(nonce)},hash:location.hash},'*')});window.addEventListener('message',function(e){if(e.source!==parent||e.data?.type!=='studio-template-mode'||e.data.nonce!==${JSON.stringify(nonce)})return;studioEditing=!!e.data.editing;if(typeof e.data.hash==='string'&&e.data.hash.startsWith('#')&&e.data.hash!==location.hash)location.hash=e.data.hash;var style=document.querySelector('style[data-studio-controls]');if(style)style.disabled=!studioEditing;});document.addEventListener('click',function(e){var el=e.target.closest('[data-studio-edit]');if(studioEditing&&el){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'studio-template-select',nonce:${JSON.stringify(nonce)},id:el.getAttribute('data-studio-edit')},'*');return;}var a=e.target.closest('a');if(a){var href=a.getAttribute('href')||'';e.preventDefault();if(href.startsWith('#'))setTimeout(function(){location.hash=href;var target=document.getElementById(href.slice(1));if(target)target.scrollIntoView();},0);}},true);document.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();},true);`;

  // Run the editing guard before template scripts, and keep vendor behavior sandboxed.
  doc.head.insertBefore(script, doc.head.children[1] || null);
  return { html: serialize(doc), elements: result.elements };
}
export async function exportSourceTemplate(
  project: Project,
  template: SourceTemplate,
) {
  const files: Record<string, Uint8Array> = {};
  for (let offset = 0; offset < template.files.length; offset += 8) {
    await Promise.all(
      template.files.slice(offset, offset + 8).map(async (file) => {
        if (!file || file.startsWith("/") || file.split("/").includes(".."))
          throw Error("Invalid template asset path.");
        const r = await fetch(`/templates/${template.id}/${file}`);
        if (!r.ok) throw Error(`Could not export ${file}. Please retry.`);
        if (template.pages.includes(file)) {
          const { doc } = editTemplateDocument(
            await r.text(),
            file,
            project.nativeTemplate?.edits || {},
            project.nativeTemplate?.customCss,
            "../".repeat(file.split("/").length - 1) + "plotform-fonts/",
          );
          doc
            .querySelectorAll("[data-studio-edit]")
            .forEach((el) => el.removeAttribute("data-studio-edit"));
          files[file] = strToU8(serialize(doc));
        } else files[file] = new Uint8Array(await r.arrayBuffer());
      }),
    );
  }
  for (const font of usedTemplateFonts(project.nativeTemplate?.edits || {})) {
    for (const suffix of [".woff2", ".LICENSE.txt"]) {
      const filename = font.id + suffix;
      const response = await fetch("/templates/_plotform-fonts/" + filename);
      if (!response.ok)
        throw Error("Could not export selected font: " + font.name);
      files["plotform-fonts/" + filename] = new Uint8Array(
        await response.arrayBuffer(),
      );
    }
  }
  files["plotform-project.json"] = strToU8(JSON.stringify(project, null, 2));
  files["PLOTFORM-SOURCE.txt"] = strToU8(
    `Original template: ${template.name}\nSource: ${template.sourceUrl}\nLicense: ${template.license}\nOriginal license files and credits are retained.\nThis export is a static website. Forms require a separately configured backend.\n`,
  );
  const zipped = zipSync(files),
    url = URL.createObjectURL(
      new Blob([zipped as unknown as BlobPart], { type: "application/zip" }),
    ),
    link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.replace(/[^a-z0-9-]/gi, "-")}-source.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
