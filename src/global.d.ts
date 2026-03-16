// Declara o require global para compatibilidade com módulos SCSS gerados pelo SPFx (webpack context)
declare function require(module: string): any;
declare var __webpack_public_path__: string;

declare module '*.scss';

declare module '*.png' {
	const value: string;
	export default value;
}
