import { JS } from 'cellx';
import { escapeHTML, unescapeHTML } from '@riim/escape-html';
import isRegExp from './Utils/isRegExp';

let Map = JS.Map;

export default new Map<any, [
	(value: string | null, defaultValue?: any) => any,
	(value: any, defaultValue?: any) => string | null
]>([
	[Boolean, [
		(value: string | null): boolean => {
			return value !== null && value != 'no';
		},
		(value: any): string | null => {
			return value ? '' : null;
		}
	]],

	['boolean', [
		(value: string | null, defaultValue: boolean): boolean => {
			return value !== null ? value != 'no' : defaultValue;
		},
		(value: any, defaultValue: boolean): string | null => {
			return value ? '' : (defaultValue ? 'no' : null);
		}
	]],

	[Number, [
		(value: string | null): number | null => {
			return value !== null ? +value : null;
		},
		(value: any): string | null => {
			return value != null ? String(+value) : null;
		}
	]],

	['number', [
		(value: string | null, defaultValue: number): number => {
			return value !== null ? +value : defaultValue;
		},
		(value: any): string | null => {
			return value != null ? String(+value) : null;
		}
	]],

	[String, [
		(value: string | null): string | null => {
			return value !== null ? value : null;
		},
		(value: any): string | null => {
			return value != null ? String(value) : null;
		}
	]],

	['string', [
		(value: string | null, defaultValue: string): string => {
			return value !== null ? value : defaultValue;
		},
		(value: any): string | null => {
			return value != null ? String(value) : null;
		}
	]],

	[Object, [
		(value: string | null): Object | null => {
			return value !== null ? Object(Function(`return ${ unescapeHTML(value) };`)()) : null;
		},
		(value: any): string | null => {
			return value != null ? escapeHTML(isRegExp(value) ? value.toString() : JSON.stringify(value)) : null;
		}
	]],

	['object', [
		(value: string | null, defaultValue: Object): Object => {
			return value !== null ? Object(Function(`return ${ unescapeHTML(value) };`)()) : defaultValue;
		},
		(value: any): string | null => {
			return value != null ? escapeHTML(isRegExp(value) ? value.toString() : JSON.stringify(value)) : null;
		}
	]]
]);
