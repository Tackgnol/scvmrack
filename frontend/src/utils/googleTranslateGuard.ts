/**
 * Google Translate wraps text nodes in <font>, so React later removes or inserts relative to
 * nodes that are no longer children. Tolerate that instead of crashing (facebook/react#11538).
 * Remove if React ships a fix or we ship `translate="no"`.
 */
const originalRemoveChild = Node.prototype.removeChild;
const originalInsertBefore = Node.prototype.insertBefore;

Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
};

Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, reference: Node | null): T {
    if (reference && reference.parentNode !== this) return node;
    return originalInsertBefore.call(this, node, reference) as T;
};
