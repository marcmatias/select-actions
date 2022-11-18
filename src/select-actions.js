export default class SelectActions {
  constructor(params) {
    this.config = {
      id: undefined,
      search: true,
      hideX: false,
      useStyles: true,
      placeholder: "Click and Select",
      txtSelected: "Selected",
      txtSelectedSingular: "Selected",
      txtAll: "All",
      txtRemove: "Remove",
      txtSearch: "Search field",
      txtNotFound: "Not found",
      minWidth: "200px",
      maxWidth: "360px",
      maxHeight: "180px",
      borderRadius: 6,
      selectAll: false,
      showOnlySelectionCount: false,
      ...params,
    };

    this.init();
  }

  init() {
    const self = this;

    const selectID = self.config.id;
    if (selectID) {
      self._createDropdown(document.querySelector(selectID));
    } else {
      for (const select of document.querySelectorAll("select")) {
        self._createDropdown(select);
      }
    }

    if (this.config.useStyles) {
      self._createStyles();
    }
  }

  _createDropdown(multiSelect) {
    const self = this;
    const div = this._newElement("div", { class: "multiselect-dropdown", "tabIndex": "0" });
    const dropdownListWrapper = this._newElement("div", {
      class: "multiselect-dropdown-list-wrapper",
    });
    const dropdownList = this._newElement("div", {
      class: "multiselect-dropdown-list",
    });

    multiSelect.parentNode.insertBefore(div, multiSelect.nextSibling);

    const search = this._newElement("input", {
      class: ["multiselect-dropdown-search"].concat([
        self.config.searchInput?.class ?? "form-control",
      ]),
      style: {
        width: "100%",
        display: self.config.search
          ? "block"
          : multiSelect.attributes.search?.value === "true"
          ? "block"
          : "none",
      },
      placeholder: self.config.txtSearch,
    });

    dropdownListWrapper.appendChild(search);
    div.appendChild(dropdownListWrapper);
    dropdownListWrapper.appendChild(dropdownList);

    dropdownList.innerHTML = "";

    multiSelect.addEventListener("change", function () {
      self._refresh(div, multiSelect);
    });

    if (
      self.config.selectAll ||
      multiSelect.attributes["select-all"]?.value === "true"
    ) {
      let optionElementAll = self._newElement("div", {
        class: "multiselect-dropdown-all-selector",
      });

      let optionCheckbox = self._newElement("input", { type: "checkbox" });
      optionElementAll.appendChild(optionCheckbox);
      optionElementAll.appendChild(
        self._newElement("label", { text: self.config.txtAll })
      );

      optionElementAll.addEventListener("click", () => {
        optionElementAll.querySelector("input").checked =
          !optionElementAll.querySelector("input").checked;

        let ch = optionElementAll.querySelector("input").checked;
        dropdownList
          .querySelectorAll(
            ":scope > div:not(.multiselect-dropdown-all-selector)"
          )
          .forEach((i) => {
            if (i.style.display !== "none") {
              i.querySelector("input").checked = ch;
              i.srcElement.selected = ch;
            }
          });

        multiSelect.dispatchEvent(new Event("change"));
      });
      optionCheckbox.addEventListener("click", () => {
        optionCheckbox.checked = !optionCheckbox.checked;
      });

      dropdownList.appendChild(optionElementAll);
    }

    if (div.previousElementSibling.multiple) {
      Array.from(multiSelect.options).map((option) => {
        let optionElement = self._newElement("div", {
          srcElement: option,
        });
        let optionCheckbox = self._newElement("input", {
          type: "checkbox",
          checked: option.selected,
        });
        optionElement.appendChild(optionCheckbox);
        optionElement.appendChild(
          self._newElement("label", { text: option.text })
        );

        optionElement.addEventListener("click", () => {
          const optionElementAll = dropdownListWrapper.querySelector(
            ".multiselect-dropdown-all-selector"
          );
          if (optionElementAll) {
            optionElementAll.querySelector("input").checked = false;
          }

          optionElement.querySelector("input").checked =
            !optionElement.querySelector("input").checked;
          optionElement.srcElement.selected = !optionElement.srcElement.selected;
          multiSelect.dispatchEvent(new Event("change"));
        });

        optionCheckbox.addEventListener("click", () => {
          optionCheckbox.checked = !optionCheckbox.checked;
        });

        option.optionElement = optionElement;

        dropdownList.appendChild(optionElement);
      });
    } else {
      Array.from(multiSelect.options).map((option) => {
        let optionElement = self._newElement("div", {
          srcElement: option,
        });
        optionElement.appendChild(
          self._newElement("label", { text: option.text })
        );

        dropdownList.appendChild(optionElement);

        if(!option.disabled) {
          optionElement.addEventListener("click", () => {
            optionElement.srcElement.selected = true;
            multiSelect.dispatchEvent(new Event("change"));
            self._closeSelect(div);
          })

          option.optionElement = optionElement;
        }
      });
    }

    div.dropdownListWrapper = dropdownListWrapper;
    self._refresh(div, multiSelect);

    search.addEventListener("input", () => {
      let notFound = true;

      const allSelectorOption = dropdownListWrapper.querySelector(
        ".multiselect-dropdown-all-selector"
      );
      if (allSelectorOption) {
        allSelectorOption.style.display = search.value.length
          ? "none"
          : "block";
      }

      dropdownList
        .querySelectorAll(":scope div:not(.multiselect-dropdown-all-selector)")
        .forEach((div) => {
          let innerText = div.querySelector("label").innerText.toLowerCase();
          if (innerText.includes(search.value.toLowerCase())) {
            div.style.display = "flex";
            notFound = false;
          } else if (!Object.values(div.classList).includes("not-found")) {
            div.style.display = "none";
          }
        });

      const nfElement = dropdownList.querySelector(".not-found");
      if (notFound) {
        if (nfElement) {
          return;
        }
        const nfDiv = self._newElement("div", { class: "not-found" });
        const nfLabel = self._newElement("label", {
          text: self.config.txtNotFound,
        });

        nfDiv.appendChild(nfLabel);
        dropdownList.appendChild(nfDiv);
      } else if (nfElement) {
        nfElement.remove();
      }
    });

    // EventListener to open select
    div.addEventListener("click", () => {
      if (div !== event.target && !event.target.classList.contains("maxselected")) return;
      self._openSelect(div, search);
    });

    div.addEventListener("keypress", (event) => {
      if (div !== event.target) return;
      if (event.key === 'Enter') {
        self._openSelect(div, search);
      }
    });

    // EventListener to close select if open and clickout
    document.addEventListener("click", (event) => {
      if (
        !div.contains(event.target) &&
        div.dropdownListWrapper.style.display === "flex"
      ) {
        self._closeSelect(div);
        this._refresh(div, multiSelect);
      }
    });

    div.addEventListener("keydown", (event) => {
      if (event.key === 'Escape') {
        self._closeSelect(div);
        this._refresh(div, multiSelect);
      }
    });
  }

  _openSelect (div, search) {
    const self = this;
    const dropDownStyle = div.dropdownListWrapper.style;
    dropDownStyle.display = "flex";

    if(this._isOutOfViewport(div.dropdownListWrapper)) {
      dropDownStyle.flexDirection = "column-reverse";
      div.querySelector(".multiselect-dropdown-search").style
        .borderTop = "solid 1px var(--color-mdd-border)";

      // This will update search input position if field size changes
      let prevHeight;
      self.resizeObserver = new ResizeObserver(changes => {
        for(const change of changes){
          if(change.contentRect.height === prevHeight) return
          prevHeight = change.contentRect.height

          let position = parseInt(self.config.maxHeight.replace("px", "")) + 2;
          position = div.clientHeight > 35 ? position - 35 : position;
          dropDownStyle.top = `-${position}px`;
          dropDownStyle.bottom = `0px`;
        }
      });
      self.resizeObserver.observe(div);
    } else {
      dropDownStyle.flexDirection = "column";
      div.querySelector(".multiselect-dropdown-search").style
        .borderBottom = "solid 1px var(--color-mdd-border)";
    }

    search.focus();
    search.select();
  }

  _closeSelect(div) {
    const self = this;

    // Remove position styles
    const dropDownStyle = div.dropdownListWrapper.style;
    const searchInput = div.querySelector(".multiselect-dropdown-search").style;
    dropDownStyle.display = "none";
    dropDownStyle.top = 0;
    dropDownStyle.bottom = null;
    searchInput.borderTop = "0px";
    searchInput.borderBottom = "0px";
    // Removing resizeObserver that defines serch position
    if (self.resizeObserver) {
      self.resizeObserver.unobserve(div);
    }
  }

  _isOutOfViewport(el) {
    const bounding = el.getBoundingClientRect();
    const out = {};
    out.top = bounding.top < 0;
    out.left = bounding.left < 0;
    out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
    out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);
    return out.top || out.left || out.bottom || out.right;
  }

  _refresh(div, multiSelect) {
    const self = this;

    // Cleaning field to populate
    div
      .querySelectorAll("span.sa-text, span.sa-ph")
      .forEach((placeholder) => div.removeChild(placeholder));

    const selected = Array.from(multiSelect.selectedOptions);
    const selectedLength = selected.length;

    if (
      (self.config.showOnlySelectionCount ||
        selectedLength > (multiSelect.attributes["max-items"]?.value ?? 5)) &&
      selectedLength > 0
    ) {
      const txtAfterCounter =
        selectedLength > 1
          ? self.config.txtSelected
          : self.config.txtSelectedSingular;
      div.appendChild(
        self._newElement("span", {
          class: ["sa-text", "optext", "maxselected"],
          text: selectedLength + " " + txtAfterCounter,
          title: `${txtAfterCounter}: \n[ ${selected
            .map((option) => option.text)
            .join(", ")} ]`,
        })
      );
    } else {
      const isMultiple = div.previousElementSibling.multiple;
      selected.map((option) => {
        let span = self._newElement("span", {
          class: isMultiple ? ["sa-text", "optext"] : ["sa-text"],
          text: option.text,
          srcElement: option,
        });

        if (!self.config.hideX && isMultiple) {
          span.prepend(
            self._newElement("span", {
              class: ["sa-del", "optdel"],
              text: "X",
              title: self.config.txtRemove,
              onclick: (event) => {
                self._deleteOpt(span, div, multiSelect);
                event.stopPropagation();
              },
              onkeydown: (event) => {
                if(event.key === 'Enter'){
                  self._deleteOpt(span, div, multiSelect);
                  e.stopPropagation();
                }
              },
              tabIndex: 0
            })
          );
        }
        div.appendChild(span);
      });
    }

    if (multiSelect.selectedOptions?.length === 0) {
      div.appendChild(
        self._newElement("span", {
          class: ["sa-ph", "placeholder"],
          text:
            multiSelect.attributes?.placeholder?.value ??
            self.config.placeholder,
        })
      );
    }
  }

  _deleteOpt(span, div, multiSelect) {
    span.srcElement.optionElement.dispatchEvent(new Event("click"));
    this._refresh(div, multiSelect);
  }

  _newElement(tag, params) {
    let el = document.createElement(tag);
    if (params) {
      Object.keys(params).forEach((key) => {
        if (key === "class") {
          Array.isArray(params[key])
            ? params[key].forEach((o) =>
                o !== "" ? el.classList.add(o) : 0
              )
            : params[key] !== ""
            ? el.classList.add(params[key])
            : 0;
        } else if (key === "style") {
          Object.keys(params[key]).forEach((value) => {
            el.style[value] = params[key][value];
          });
        } else if (key === "text") {
          params[key] === ""
            ? (el.innerHTML = "&nbsp;")
            : (el.innerText = params[key]);
        } else if (key === "tabindex") {
            el[key] = params[key];
        } else {
          el[key] = params[key];
        }
      });
    }
    return el;
  }

  _createStyles() {
    const self = this;

    let styles = {
      ":root": {
        "--border-radius--base": `${parseInt(self.config.borderRadius)}px`,
        "--border-radius--small": `${
          parseInt(self.config.borderRadius) * 0.75
        }px`,
      },
      ".multiselect-dropdown": {
        "min-width": `${self.config.minWidth}`,
        "max-width": `${self.config.maxWidth}`,
      },
      ".multiselect-dropdown-list": {
        "max-height": `${self.config.maxHeight}`,
      },
    };

    const style = document.createElement("style");

    style.setAttribute("type", "text/css");
    style.innerHTML += `${Object.keys(styles)
      .map(
        (selector) =>
          `${selector} { ${Object.keys(styles[selector])
            .map((property) => `${property}: ${styles[selector][property]}`)
            .join("; ")} }`
      )
      .join("\n")}`;

    document.head.appendChild(style);
  }
}
