export class Node<T> {
  list: List<T>;
  cargo: T;
  next: Node<T> | null;
  previous: Node<T> | null;

  constructor(list: List<T>, cargo: any, next: Node<T>) {
    this.list = list;
    this.cargo = cargo;
    this.next = next;
    this.previous = null;
  }

  remove() {
    if (this.previous) {
      this.previous.next = this.next;
    } else {
      this.list.head = this.next;
    }
    this.next && (this.next.previous = this.previous);
  }
}

export class List<T> {
  head: Node<T>;

  constructor() {
    this.head = null;
  }

  add(cargo: any): Node<T> {
    const node = new Node(this, cargo, this.head);
    this.head && (this.head.previous = node);
    this.head = node;
    return node;
  }

  iter(fn: (cargo: T) => void) {
    let node: Node<T> | null = this.head;
    while (node != null) {
      fn(node.cargo);
      node = node.next;
    }
  }
}
