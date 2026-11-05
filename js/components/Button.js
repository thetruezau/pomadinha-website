export class Button {
  constructor(label, action = null) {
    this.label = label;
    this.action = action;
    this.element = document.createElement('button');
    this.element.className = 'btn';
    this.element.type = 'button';
    this.element.textContent = this.label;

    if (this.action) {
      this.element.addEventListener('click', (e) => {
        e.stopPropagation();
        this.action();
      });
    }
  }

  render(parent) {
    parent.appendChild(this.element);
    return this;
  }
}
