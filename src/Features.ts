let dummyEl = document.createElement('div');

dummyEl.innerHTML = '<template>1</template>';
export let templateTag = !(dummyEl.firstChild as HTMLElement).firstChild;

let nativeCustomElementsFeature = false;

function TestNativeCustomElementsFeature(self: any) {
	return HTMLElement.call(this, self);
}
Object.defineProperty(TestNativeCustomElementsFeature, 'observedAttributes', {
	get() {
		return ['test'];
	}
});
TestNativeCustomElementsFeature.prototype = Object.create(HTMLElement.prototype, {
	constructor: { value: TestNativeCustomElementsFeature }
});
TestNativeCustomElementsFeature.prototype.attributeChangedCallback = function() {
	nativeCustomElementsFeature = true;
};

(window as any).customElements.define('test-native-custom-elements-feature', TestNativeCustomElementsFeature);

let testNCEF = document.createElement('test-native-custom-elements-feature');
testNCEF.setAttribute('test', '');

export let nativeCustomElements = nativeCustomElementsFeature;
