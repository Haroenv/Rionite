import { Utils } from 'cellx';
import elementConstructorMap from './elementConstructorMap';
import ElementProtoMixin from './ElementProtoMixin';
import { hasOwn } from './JS/Object';

let mixin = Utils.mixin;

let inheritedStaticProperties = [	
	'elementExtends',
	'elementAttributes',
	'props',
	'i18n',
	'template',
	'assets'
];

export default function registerComponent(componentConstr) {
	let elIs = componentConstr.elementIs;

	if (!elIs) {
		throw new TypeError('Static property "elementIs" is required');
	}

	let parentComponentConstr;

	inheritedStaticProperties.forEach(name => {
		if (!hasOwn.call(componentConstr, name)) {
			Object.defineProperty(componentConstr, name, Object.getOwnPropertyDescriptor(
				parentComponentConstr ||
					(parentComponentConstr = Object.getPrototypeOf(componentConstr.prototype).constructor),
				name
			));
		}
	});

	let elExtends = componentConstr.elementExtends;

	let parentElConstr = elExtends ?
		elementConstructorMap[elExtends] ||
			window[`HTML${ elExtends.charAt(0).toUpperCase() + elExtends.slice(1) }Element`] :
		HTMLElement;

	let elConstr = function(self) {
		parentElConstr.call(this, self);
		return self;
	};
	let elProto = elConstr.prototype = Object.create(parentElConstr.prototype);

	Object.defineProperty(elConstr, 'observedAttributes', {
		configurable: true,
		enumerable: true,
		get() {
			return Object.keys(componentConstr.elementAttributes || {});
		}
	});

	mixin(elProto, ElementProtoMixin);

	Object.defineProperty(elProto, 'constructor', {
		configurable: true,
		writable: true,
		value: elConstr
	});

	elProto._rioniteComponentConstructor = componentConstr;

	elementConstructorMap[elIs] = customElements.define(elIs, elConstr, elExtends ? { extends: elExtends } : null);

	return componentConstr;
}
