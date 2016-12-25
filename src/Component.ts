import { IEvent, EventEmitter, JS, Utils } from 'cellx';
import DisposableMixin from './DisposableMixin';
import registerComponent from './registerComponent';
import ElementAttributes from './ElementAttributes';
import initElementClasses from './initElementClasses';
import initElementAttributes from './initElementAttributes';
import bindContent from './bindContent';
import { IFreezableCell, freezeBindings, unfreezeBindings } from './componentBinding';
import attachChildComponentElements from './attachChildComponentElements';
import bindEvents from './bindEvents';
import eventTypes from './eventTypes';
import onEvent from './onEvent';
import camelize from './Utils/camelize';
import getUID from './Utils/getUID';
import htmlToFragment from './Utils/htmlToFragment';
import { nativeCustomElements as nativeCustomElementsFeature } from './Features';

let Map = JS.Map;
let createClass = (Utils as any).createClass;

let map = Array.prototype.map;

export interface IComponentElement extends HTMLElement {
	rioniteComponent: Component | null;
	$c: Component;
}

export interface IComponentProperties extends ElementAttributes {
	_content: DocumentFragment | null;
	context: Object | null;
}

export interface IComponentTemplate {
	render: (data: Object) => string;
}

export interface IComponentAssetClassNames {
	[assetName: string]: string;
}

export interface IComponentEvents<T> {
	[assetName: string]: {
		[eventName: string]: (this: T, evt: IEvent | Event, target: HTMLElement) => boolean | void;
	};
}

let created: any;
let initialize: any;
let ready: any;
let elementAttached: any;
let elementDetached: any;
let elementMoved: any;
let elementAttributeChanged: any;

export default class Component extends EventEmitter implements DisposableMixin {
	static extend(elIs: string, description: any): typeof Component {
		description.Extends = this;
		(description.Static || (description.Static = {})).elementIs = elIs;
		return (registerComponent as any)(createClass(description));
	}

	static _registeredComponent: typeof Component;
	static register = registerComponent;

	static elementIs: string;
	static elementExtends: string;

	static elementAttributes: { [name: string]: any } | null;
	static props: { [name: string]: any } | null;

	static i18n: { [key: string]: any };

	static template: string | IComponentTemplate | null;

	static _rawContent: DocumentFragment;

	static _markupBlockNames: Array<string>;
	static _assetClassNames: IComponentAssetClassNames;

	static events: IComponentEvents<Component> | null;

	_disposables: any;
	listenTo: any;
	_listenTo: any;
	setTimeout: any;
	setInterval: any;
	registerCallback: any;

	ownerComponent: Component | null = null;

	_parentComponent: Component | null | undefined = null;

	get parentComponent(): Component | null {
		if (this._parentComponent !== undefined) {
			return this._parentComponent;
		}

		for (let node: any; (node = (node || this.element).parentNode);) {
			if (node.$c) {
				return (this._parentComponent = node.$c);
			}
		}

		return (this._parentComponent = null);
	}

	element: IComponentElement;

	get elementAttributes(): ElementAttributes {
		let attrs = new ElementAttributes(this.element);

		Object.defineProperty(this, 'elementAttributes', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: attrs
		});

		return attrs;
	}

	get props(): IComponentProperties {
		let props = Object.create(this.elementAttributes) as IComponentProperties;

		props._content = null;
		props.context = null;

		Object.defineProperty(this, 'props', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: props
		});

		return props;
	}

	_bindings: Array<IFreezableCell> | null;

	_assets: Map<string, NodeListOf<HTMLElement>>;

	isElementAttached = false;

	initialized = false;
	isReady = false;

	_isComponentSilent: boolean;

	constructor(el: HTMLElement | string | null | undefined, props: { [name: string]: any }) {
		super();
		DisposableMixin.call(this);

		let constr = this.constructor as typeof Component;

		if (constr._registeredComponent !== constr) {
			throw new TypeError('Component must be registered');
		}

		if (el == null) {
			el = document.createElement(constr.elementIs);
		} else if (typeof el == 'string') {
			let elIs = constr.elementIs;
			let html = el;

			el = document.createElement(elIs);
			el.innerHTML = html;

			let firstChild = el.firstChild;

			if (
				firstChild && firstChild == el.lastChild && firstChild.nodeType == 1 && (
					(firstChild as HTMLElement).tagName.toLowerCase() == elIs ||
						(firstChild as HTMLElement).getAttribute('is') == elIs
				)
			) {
				el = firstChild as HTMLElement;
			}
		}

		this.element = el as IComponentElement;

		(el as IComponentElement).rioniteComponent = this;
		Object.defineProperty(el, '$c', { value: this });

		if (props) {
			let properties = this.props;

			for (let name in props) {
				properties[camelize(name)] = props[name];
			}
		}

		this.created();
	}

	_handleEvent(evt: IEvent) {
		super._handleEvent(evt);

		let silent = this._isComponentSilent;

		if (silent === undefined) {
			silent = this._isComponentSilent = this.element.hasAttribute('rt-silent');
		}

		if (!silent && evt.bubbles !== false && !evt.isPropagationStopped) {
			let parentComponent = this.parentComponent;

			if (parentComponent) {
				parentComponent._handleEvent(evt);
			} else {
				onEvent(evt);
			}
		}
	}

	_attachElement() {
		if (!this.initialized) {
			this.initialize();
			this.initialized = true;
		}

		let constr = this.constructor as typeof Component;

		if (this.isReady) {
			this._unfreezeBindings();

			if (constr.events) {
				bindEvents(this, constr.events);
			}
		} else {
			let el = this.element;

			initElementClasses(el, constr);
			initElementAttributes(this, constr);

			let template = constr.template;

			if (template == null) {
				if (constr.events) {
					bindEvents(this, constr.events);
				}
			} else {
				let inputContent = this.props._content = document.createDocumentFragment();

				for (let child: Node | null; (child = el.firstChild);) {
					inputContent.appendChild(child);
				}

				let rawContent = constr._rawContent;

				if (!rawContent) {
					rawContent = constr._rawContent = htmlToFragment(
						typeof template == 'string' ? template : template.render(constr)
					);
				}

				let content = rawContent.cloneNode(true);
				let { bindings, childComponents } = bindContent(content, this);

				this._bindings = bindings;

				this.element.appendChild(content);

				if (!nativeCustomElementsFeature && childComponents) {
					attachChildComponentElements(childComponents);
				}

				if (constr.events) {
					bindEvents(this, constr.events);
				}

				this.ready();
				this.isReady = true;
			}
		}

		this.elementAttached();
	}

	_detachElement() {
		this.elementDetached();
		this.dispose();
	}

	dispose(): Component {
		this._freezeBindings();
		return DisposableMixin.prototype.dispose.call(this);
	}

	_freezeBindings() {
		if (this._bindings){
			freezeBindings(this._bindings);
		}
	}

	_unfreezeBindings() {
		if (this._bindings){
			unfreezeBindings(this._bindings);
		}
	}

	// Callbacks

	created() {}
	initialize() {}
	ready() {}
	elementAttached() {}
	elementDetached() {}
	elementMoved() {}
	elementAttributeChanged(name: string, oldValue: any, value: any) {}

	// Utils

	$(name: string, container?: Component | HTMLElement): Component | HTMLElement | null {
		let assetList = this._getAssetList(name, container);
		return assetList && assetList.length ? (assetList[0] as IComponentElement).$c || assetList[0] : null;
	}

	$$(name: string, container?: Component | HTMLElement): Array<Component | HTMLElement> {
		let assetList = this._getAssetList(name, container);
		return assetList ? map.call(assetList, (el: IComponentElement) => el.$c || el) : [];
	}

	_getAssetList(name: string, container?: Component | HTMLElement): NodeListOf<HTMLElement> | undefined {
		let assets = this._assets || (this._assets = new Map<string, NodeListOf<HTMLElement>>());
		let containerEl: HTMLElement = container ?
			(container instanceof Component ? container.element : container) :
			this.element;
		let key = container ? getUID(containerEl) + '/' + name : name;
		let assetList = assets.get(key);

		if (!assetList) {
			let constr = this.constructor as typeof Component;
			let className = constr._assetClassNames[name];

			if (className) {
				assetList = containerEl.getElementsByClassName(className) as NodeListOf<HTMLElement>;
				assets.set(key, assetList);
			} else {
				let markupBlockNames = constr._markupBlockNames;

				if (!markupBlockNames) {
					throw new TypeError('Component must have a template');
				}

				for (let i = markupBlockNames.length; i;) {
					className = markupBlockNames[--i] + '__' + name;

					assetList = containerEl.getElementsByClassName(className) as NodeListOf<HTMLElement>;

					if (assetList.length) {
						constr._assetClassNames[name] = className;
						assets.set(key, assetList);
						break;
					}
				}

				if (!assetList.length) {
					return;
				}
			}
		}

		return assetList;
	}
}

let DisposableMixinProto = DisposableMixin.prototype;
let ComponentProto = Component.prototype;

Object.getOwnPropertyNames(DisposableMixinProto).forEach(name => {
	if (!(name in ComponentProto)) {
		Object.defineProperty(ComponentProto, name, Object.getOwnPropertyDescriptor(DisposableMixinProto, name));
	}
});

created = ComponentProto.created;
initialize = ComponentProto.initialize;
ready = ComponentProto.ready;
elementAttached = ComponentProto.elementAttached;
elementDetached = ComponentProto.elementDetached;
elementMoved = ComponentProto.elementMoved;
elementAttributeChanged = ComponentProto.elementAttributeChanged;

document.addEventListener('DOMContentLoaded', function onDOMContentLoaded() {
	document.removeEventListener('DOMContentLoaded', onDOMContentLoaded);

	eventTypes.forEach(type => {
		document.addEventListener(type, onEvent);
	});
});
