from __future__ import annotations

import re
from typing import Any

import nbformat
from flask import Flask, jsonify, request
from nbconvert import HTMLExporter

app = Flask(__name__)


def _extract_body_fragment(html: str) -> str:
    match = re.search(r"<body[^>]*>(.*)</body>", html, flags=re.IGNORECASE | re.DOTALL)
    fragment = match.group(1) if match else html
    # Basic safety guard for embedded script tags.
    fragment = re.sub(r"<script\b[^>]*>.*?</script>", "", fragment, flags=re.IGNORECASE | re.DOTALL)
    return fragment


def _normalize_notebook(nb: Any) -> Any:
    nb.metadata.setdefault("language_info", {})
    nb.metadata["language_info"]["name"] = "python"
    nb.metadata["language_info"]["pygments_lexer"] = "python"
    nb.metadata.setdefault("kernelspec", {})
    nb.metadata["kernelspec"]["name"] = "python3"
    nb.metadata["kernelspec"]["display_name"] = "Python 3"

    for cell in nb.cells:
        if getattr(cell, "cell_type", "") == "code":
            cell.metadata.setdefault("language", "python")
    return nb


@app.post("/api/convert-notebook")
def convert_notebook() -> Any:
    uploaded = request.files.get("notebook")
    if not uploaded:
        return jsonify({"error": "Missing notebook file in form field 'notebook'"}), 400

    filename = uploaded.filename or "notebook.ipynb"
    if not filename.lower().endswith(".ipynb"):
        return jsonify({"error": "Only .ipynb files are supported"}), 400

    try:
        content = uploaded.read().decode("utf-8")
        nb = nbformat.reads(content, as_version=4)
        nb = _normalize_notebook(nb)

        exporter = HTMLExporter(template_name="lab")
        exporter.exclude_input_prompt = True
        exporter.exclude_output_prompt = True

        html, _ = exporter.from_notebook_node(nb)
        fragment = _extract_body_fragment(html)

        wrapped = (
            f'<div class="jp-notebook imported-notebook" data-filename="{filename}">'
            f"<h3>Notebook: {filename}</h3>{fragment}</div>"
        )

        return jsonify({"html": wrapped, "file_name": filename})
    except Exception as exc:
        return jsonify({"error": f"Notebook conversion failed: {exc}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)
