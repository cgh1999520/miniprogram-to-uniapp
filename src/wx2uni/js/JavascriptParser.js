// const Parser = require('./Parser')  //基类
const path = require('path');
const babylon = require('babylon')  //AST解析器
const parse = require('@babel/parser').parse;
const generate = require('@babel/generator').default
const traverse = require('@babel/traverse').default

class JavascriptParser {
    constructor() {
    }

    /**
     * 解析前替换掉无用字符
     * 1.export default App; --> ""
     * // 2.(var|let|const) app = getApp; --> ""
     * 3.getApp().page({ --> ""
     * 4.exports.default = App({ --> ""
     * @param {*} code
     */
    beforeParse (code, isAppFile) {
        let newCode = code.replace(/export default App;?/img, '')
            .replace(/^getApp\(\)\.page\({/img, 'Page({')
            .replace(/^exports\.default\s+=\s+App\({/img, 'App({')
            .replace(/,\s*Page\(\s*\{/g, '; Page({');

        if (!isAppFile) {
            //适配：app.globalData.skin
            //排除：getApp().globalData.skin
            newCode = newCode.replace(/(\w+)\.globalData\./img, '$1.');
        }
        return newCode;
    }

    /**
     * 获取定义的getApp()别名
     * @param {*} code
     */
    getAliasGetAppNameList (code) {
        const reg = /(var|let|const)\s*(\w+)\s*=\s*getApp\(\)\s*,|(var|let|const)\s*(\w+)\s*=\s*getApp\(\)(?!\.)[;]?/gm;
        let result = {};
        code.replace(reg, function (match, $1, $2, $3, $4) {
            result[$2 || $4] = true;
            return match; //随意返回
        });
        return result;
    }

    /**
     * 文本内容解析成AST
     * @param {*} scriptText
     */
    parse (scriptText) {
        let ast = parse(scriptText, {
            sourceType: 'module',
            // Note that even when this option is enabled, @babel/parser could throw for unrecoverable errors.
            // errorRecovery: true,  //没啥用，碰到let和var对同一变量进行声明时，当场报错！还会中断转换进程
            plugins: [
                "asyncGenerators",
                "classProperties",
                "decorators-legacy", //"decorators",
                "doExpressions",
                "dynamicImport",
                "exportExtensions",
                "flow",
                "functionBind",
                "functionSent",
                "jsx",
                "objectRestSpread",
            ]
        });
        // resolve(ast);

        //使用下面的代码，在遇到解构语法(...)时，会报错，改用babel-parser方案
        // const scriptParsed = babylon.parse(scriptText, {
        //   sourceType: 'module',
        //   plugins: [
        //     // "estree", //这个插件会导致解析的结果发生变化，因此去除，这本来是acron的插件
        //     "jsx",
        //     "flow",
        //     "doExpressions",
        //     "objectRestSpread",
        //     "exportExtensions",
        //     "classProperties",
        //     "decorators",
        //     "asyncGenerators",
        //     "functionBind",
        //     "functionSent",
        //     "throwExpressions",
        //     "templateInvalidEscapes",
        //   ]
        // })
        // resolve(scriptParsed);

        return ast;
    }

    /**
     * AST树遍历方法
     * @param astObject
     * @returns {*}
     */
    traverse (astObject) {
        return traverse(astObject)
    }

    /**
     * 模板或AST对象转文本方法
     * @param astObject
     * @param code
     * @returns {*}
     */
    generate (astObject, code) {
        const newScript = generate(astObject, {}, code)
        return newScript
    }
}
module.exports = JavascriptParser
