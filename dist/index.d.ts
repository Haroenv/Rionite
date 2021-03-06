import { Parser as BemlParser, Template as BemlTemplate } from '@riim/beml';
import { IDisposable, IDisposableListening, IDisposableTimeout, IDisposableInterval, IDisposableCallback, TListeningTarget, IListener, default as DisposableMixin } from './DisposableMixin';
import formatters from './formatters';
import { ILocaleSettings, ILocalizationTexts, IGetTextConfig, IGetText, default as getText } from './getText';
import { IComponentElement, IComponentTemplate, IComponentElementClassNameMap, IComponentEvents, default as Component } from './Component';
import RtContent from './Components/rt-content';
import { TRtIfThenIfCell, default as RtIfThen } from './Components/rt-if-then';
import RtIfElse from './Components/rt-if-else';
import { TRtRepeatListCell, TRtRepeatItem, TRtRepeatItemList, TRtRepeatItemMap, default as RtRepeat } from './Components/rt-repeat';
import { IComponentProperties, default as ComponentProperties } from './ComponentProperties';
import d from './d';
declare let Components: {
    RtContent: typeof RtContent;
    RtIfThen: typeof RtIfThen;
    RtIfElse: typeof RtIfElse;
    RtRepeat: typeof RtRepeat;
};
declare let Utils: {
    camelize: (str: string) => string;
    hyphenize: (str: string) => string;
    escapeString: (str: string) => string;
    escapeHTML: (str: string) => string;
    unescapeHTML: (str: string) => string;
    isRegExp: (value: any) => boolean;
    defer: (cb: () => void, context?: any) => void;
    htmlToFragment: (html: string) => DocumentFragment;
};
export { BemlParser, BemlTemplate, IDisposable, IDisposableListening, IDisposableTimeout, IDisposableInterval, IDisposableCallback, TListeningTarget, IListener, DisposableMixin, formatters, ILocaleSettings, ILocalizationTexts, IGetTextConfig, IGetText, getText, IComponentElement, IComponentTemplate, IComponentElementClassNameMap, IComponentEvents, Component, TRtIfThenIfCell, TRtRepeatListCell, TRtRepeatItem, TRtRepeatItemList, TRtRepeatItemMap, Components, IComponentProperties, ComponentProperties, d, Utils };
