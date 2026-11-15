import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const mainJs = await readFile(new URL("../docs/main.js", import.meta.url), "utf8");

test("manual copy fallback keeps the exact command selected on repeated failure", async () => {
  const command = "npx skills add https://github.com/latent-spaces/brag --skill brag";
  let selected = null;
  let onClick;
  let activeElement = null;

  const code = { textContent: `$ ${command}` };
  const pre = {
    manualCopy: null,
    children: [],
    appendChild(element) {
      this.manualCopy = element;
      this.children.push(element);
      element.parentElement = this;
    },
    querySelector(selector) {
      if (selector === "code") return code;
      if (selector === ".copy-fallback") return this.manualCopy;
      assert.fail(`unexpected selector: ${selector}`);
    },
  };
  const button = {
    dataset: { copy: command },
    textContent: "copy",
    addEventListener(event, listener) {
      assert.equal(event, "click");
      onClick = listener;
    },
    closest(selector) {
      assert.equal(selector, ".install");
      return pre;
    },
  };
  const selection = {
    removeAllRanges() {
      selected = null;
    },
    addRange(range) {
      selected = range.target.textContent;
    },
    toString() {
      return selected ?? "";
    },
  };
  const document = {
    body: {
      appendChild(element) {
        element.parentElement = this;
      },
      removeChild(element) {
        if (selected === element.value) selected = null;
        element.parentElement = null;
      },
    },
    createElement(tag) {
      assert.equal(tag, "textarea");
      return {
        attributes: {},
        style: {},
        value: "",
        readOnly: false,
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
        getAttribute(name) {
          return this.attributes[name];
        },
        focus() {
          activeElement = this;
        },
        select() {
          selected = this.value;
        },
        setSelectionRange(start, end) {
          selected = this.value.slice(start, end);
        },
      };
    },
    createRange() {
      return {
        selectNodeContents(target) {
          this.target = target;
        },
      };
    },
    execCommand() {
      return false;
    },
    getElementById() {
      return null;
    },
    querySelectorAll() {
      return [button];
    },
  };
  const window = { getSelection: () => selection };
  const navigator = {
    clipboard: {
      async writeText() {
        throw new Error("clipboard permission denied");
      },
    },
  };

  vm.runInNewContext(mainJs, { document, navigator, window, setTimeout });
  await onClick();
  await onClick();

  assert.equal(selection.toString(), command);
  assert.equal(pre.children.length, 1);
  assert.equal(pre.manualCopy.value, command);
  assert.equal(pre.manualCopy.readOnly, true);
  assert.equal(pre.manualCopy.getAttribute("aria-label"), "Install command to copy manually");
  assert.equal(pre.manualCopy.parentElement, pre);
  assert.notEqual(pre.manualCopy.hidden, true);
  assert.equal(activeElement, pre.manualCopy);
});
