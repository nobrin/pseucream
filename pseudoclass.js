/*
	PseudoClass (2011-10-13)
	written by Nob-rin.

	History:
		2011-10-13 : Protectedに対応(Pseudo2)
		           : 多段の継承に対応
		2011-01-15 : PseudoClassを実装(IEでは未確認;目標はIE8)
		2011-01-13 : Adjust for IE.
*/

function debug() {
	if(/*@cc_on!@*/false){ 		// Recognaize IE
		var a = [];
		for(var i=0;i<arguments.length;i++){ a.push(arguments[i]); }
		alert(a.join(" "));
	}else{
		// スタックトレースしてdebugがコールされた場所を特定
		var e = new Error();
		if(e.stack){
			var stacks = e.stack.split("\n");
			var stack = e.stack.split("\n")[1];
			m = stack.match(/@(.+):(\d+)/);
		}
/*
		console.groupCollapsed.apply(window, arguments);
		console.trace();
 */
 		// debugがコールされた場所と共に出力する
		console.group("%c%o:%d", "font-weight:normal", m[1], m[2]);
		console.debug.apply(window, arguments);
		console.groupEnd()
	}
}

var initSuper;
var PseudoClass = new (function() {
	// PseudoClass Utils Ver.2 Rel.2011-10-13
	// 現時点ではObjectおよびError(SyntaxErrorなども含む)の継承を想定
	// 追加されるプロパティ
	//   __pooBase			: 親オブジェクト(Class#__pooBase)
	//   __pooConstructor	: ユーザー定義コンストラクタ、というかイニシャライザ(Class.__pooConstructor)
	//   callSuper			: object.getValue.callSuper()でスーパークラスのメソッド呼び出し
	//   initSuper			: 親オブジェクトの初期化
	//						  親オブジェクトのイニシャライザが引数を取る場合は現在のイニシャライザからコールする。
	//   protected			: Protected変数の宣言および初期化
	//   setProtected		: Protected変数への代入
	//   getProtected		: Protected変数の取得
	//   callProtectedMethod: Protectedメソッドのコール(定義はprotectedかsetProtectedで行う)
	//						  Protected変数はクロージャ内にあるので原理的に外部からはアクセスできない
	//
	// 使用方法(Protected)
	// ・2011-10-13から導入されたProtected変数
	//   protected等をコールしたメソッドがオブジェクトのプロパティかどうかからチェックしているため、
	//   呼び出す場所によっては適切に使用されていてもReferenceErroになる事がある
	//   (例：jQuery.each()の中など)
	//   この事象を回避するには変数を操作するときはローカル変数を使い、最終的にprotectedに格納する。
	//   リテラルの場合が面倒かも・・・
	
	// 発生する例外
	//   TypeError
	//     - The arg1 of initSuper() must be PseudoClass object. [..]
	//       initSuperをコールするときに第一引数に自オブジェクトを指定しなかった
	//   SyntaxError
	//     - initSuper() is only used in PseudoClass constructor.
	//       initSuperをイニシャライザ以外の場所からコールした
	//     - Constructor must be called with 'new'.
	//     - Super class [..] has no default constructor. InitSuper is required.
	//   ReferenceError
	//     - Super class does not have function '..'.
	//     - Protected property can not be referenced by outlier of the defined class.
	//     - '..' is not defined as protected.
	//     - '..' is defined in superior class. The, '..' can not use it.
	
	var thisIsForPrototype = function(){};	// prototypeのための空オブジェクト作成用の認識オブジェクト

	var _throwError = function(e) {
		// e.stackがあるFirefoxではスタック位置を調整してエラーを究明しやすくする
		// e.stackはいじらないが、e.fileNameおよびe.lineNumberを正しい位置にする
		// 調整しないとevalの位置を指してしまう・・・
		if(!e.stack){ throw e; }
		stacks = e.stack.split("\n");
		var stack = "";
		while((stack = stacks.pop()) === ""){ true; }
		var m = stack.match(/@(.+):(\d+)/);
		if(m){ e.fileName = m[1]; e.lineNumber = m[2]; }
		else{  e.fileName = "@local"; e.lineNumber = 0; }
		window["err"] = e;
		throw e;
	};

	initSuper = function(self) {
		// ディフォルトコンストラクタがない場合_pooBaseオブジェクトを作成する
		if(!self.constructor.__pooConstructor){
			// 第一引数にPseudoClassオブジェクトが指定されていない
			_throwError(new TypeError("The arg1 of initSuper() must be PseudoClass object. [" + self + "]"));
		}
		if(!(arguments.callee.caller === self.constructor.__pooConstructor)){
			// initSuperがPseudoClassコンストラクタ以外で使われた
			_throwError(new SyntaxError("initSuper() is only used in PseudoClass constructor."));
		}
		
		var _newWithApply = function(constructor, args) {
			// applyを使ったnewを行うための関数
			var _F = function() { return constructor.apply(this, args); }
			_F.prototype = constructor.prototype;
			_F.__pooConstructor = constructor.__pooConstructor;
			return new _F();
		};

		var args = Array.prototype.slice.call(arguments, 1),
			cls = self.constructor,
			baseClass = cls.prototype.constructor,
			pooBase = _newWithApply(baseClass, args);

		for(var k in pooBase){	// hasOwnPropertyの縛りは必要か？
			if(pooBase.hasOwnProperty(k)){ self[k] = pooBase[k]; }
		}

		self.__pooBase = pooBase;
		self.constructor = cls;
	};

	this.define = function(name, base, func) {
		// var TestClass = PseudoClass("TestClass", Object, function(){})の代わりに
		// PseudoClass.define("TestClass", Object, function(){});と定義可能にする
		window[name] = this.create(name, base, func);
	};

	this.create = function(name, base, func) {
		// PseudoClassクラスを定義する
		var _createBaseObject = function() {
			// クラスの初期化時にprototypeに渡すために空のベースオブジェクトを作成
			if(base !== Object) {
				var o = new base(thisIsForPrototype);
				o.constructor = base;
				return o;
			}
			return new Object();
		};

		var _overrideFuncs = function(obj) {
			// コンストラクタを除く全てのfunctionにcallSuper関数を追加する
			for(var k in obj){
				if(k !== "constructor" && obj.hasOwnProperty(k) && obj[k] instanceof Function){
					obj[k].callSuper = (function(funcName) {
						// callSuperの実体のクロージャを定義する
						return function() {
							// __pooBaseをたどって関数を探す。なければエラー
							var objBase = obj;
							while(objBase = objBase.__pooBase){
								if(objBase.hasOwnProperty(funcName)){ return objBase[funcName].apply(obj, arguments); }
							}
							throw new ReferenceError("Super class does not have function '" + funcName + "'.");
						}
					})(k);
				}
			}
		};

	/* 保留 2011-10-12 -- super.superができない
		var _t_overrideFuncs = function(obj) {
			// constructorを除くすべてのfunctionにsuperを追加する
			for(var k in obj){
				if(obj.hasOwnProperty(k) && obj[k] instanceof Function && k !== "constructor"){
					var objBase = obj;
					while(objBase = objBase.__pooBase){
						obj[k].super = (function(o, objBase, funcName) {
							return function() {
								return objBase[funcName].apply(o, arguments);
							};
						})(obj, objBase, k);
						break;
					}
				}
			}
		};
	 */

		var _setMethodsForProtectedVariables = function(self) {
			// Protectedを扱うメソッド群を定義
			// 最も基底となるオブジェクトに対してのみ適用する
			var DEBUG = false;
			var _protectedVariable = {};	// protected値を保持するオブジェクト
			var _isProperCall = function(obj, caller) {
				// 2011-10-13
				// callerがobj中かを確認するので場合によってはエラーになる
				// 今のところjQuery.each()中では使えない
				// 多分eval中もダメだろう
				// 適宜回避すること。
				if(DEBUG){ return true; }
				// 本来のprotectedの呼び出しか？
				if(caller === obj.constructor.__pooConstructor){
					// コンストラクタ中での呼び出し
					// 厳密にはオブジェクトの一致まで検査できない
					return true;
				}

				for(var k in obj){
					if(obj.hasOwnProperty(k) && obj[k] instanceof Function){
						if(caller === obj[k]){ return true; }
					}
				}
	
				_throwError(new ReferenceError(
					"Protected property can not be referenced by outlier of the defined class."
				));
			};

			var _checkProtectedLevel = function(obj, name) {
				if(DEBUG){ return true; }
				// アクセスする変数は自分またはそのベースクラスで定義されたか？
				if(!_protectedVariable.hasOwnProperty(name)){
					throw new ReferenceError("'" + name + "' is not defined as protected.");
				}
				if(!(obj instanceof _protectedVariable[name].owner)){
					throw new ReferenceError(
						"'" + name + "' is defined in superior class. The, " + obj.constructor.name + " can not use it."
					);
				}
			};

			self.callProtectedMethod = function(name) {
				// Protectedなメソッドをコールする
				// セットは通常のprotectedまたはsetProtectedを使用する
				var args = Array.prototype.slice.call(arguments, 1);
				var func = this.getProtected(name);
				return func.apply(this, args);
			};

			self.protected = function(name, value) {
				// Protectedの宣言および定義
				if(!_protectedVariable.hasOwnProperty(name)){
					_protectedVariable[name] = {
						owner	: this.constructor,
						value	: null
					};
				}

				// より基底なクラスで再定義されたらownerを書き換える
				if(_protectedVariable[name].owner.prototype instanceof this.constructor){
					_protectedVariable[name].owner = this.constructor;
				}
				if(value !== undefined){ this.setProtected(name, value) }
			};

			self.setProtected = function(name, value) {
				// Protectedの値を格納する。先にprotectedでの宣言が必要
				// protected()内でsetProtectedが呼ばれた際のcallerの調整
				var caller = arguments.callee.caller;
				if(caller === this.protected){ caller = caller.caller; }
				_isProperCall(this, caller);
				_checkProtectedLevel(this, name);
				_protectedVariable[name].value = value;
			};

			self.getProtected = function(name) {
				// Protectedの値を取得する
				var caller = arguments.callee.caller;
				if(caller === this.callProtectedMethod){ caller = caller.caller; }
				_isProperCall(this, arguments.callee.caller);
				_checkProtectedLevel(this, name);
				return _protectedVariable[name].value;
			};
		};

		var cls = null;
		var s =
			"function " + name + "(){\n"										// コンストラクタを作成
			+ "if(!(this instanceof arguments.callee)){"
			+ "  _throwError(new SyntaxError('Constructor must be called with \\'new\\'.')); }\n"	// newが使われていない
			+ "if(arguments.length === 1 && arguments[0] === thisIsForPrototype){ return; }\n"	// 空のオブジェクトを作成(prototype用)
			+ "var baseClass = cls.prototype.constructor;\n"					// ベースクラスのコンストラクタ
			+ "var baseFunc = cls.prototype.constructor.__pooConstructor;\n"	// ベースクラスの実際のコンストラクタ
			+ "if(!baseFunc){ _setMethodsForProtectedVariables(this); }"		// Protectedを扱うメソッド群を定義
			+ "else if(baseFunc && baseFunc.length === 0){\n"					// 実際のコンストラクタが引数無しなら初期化を実行
			+ "  var pooBase = new baseClass();\n"								// newによりベースオブジェクトを作成
			+ "  for(var k in pooBase){\n"										// プロパティとメソッドをコピー
			+ "    if(pooBase.hasOwnProperty(k)){ this[k] = pooBase[k]; }\n"	// hasOwnPropatyの縛りは必要？
			+ "  }\n"															// コンストラクタもコピーされるので次に再代入
			+ "  this.__pooBase = pooBase;\n"									// ベースオブジェクトを代入
			+ "}\n"
			+ "this.constructor = cls;\n"										// コンストラクタを代入
			+ "cls.__pooConstructor.apply(this, arguments);\n"					// 実際のコンストラクタで初期化
//			+ "if(baseClass !== Object && this.__pooBase === undefined){\n"		// ベースオブジェクトが初期化されていない
			+ "if(baseFunc && this.__pooBase === undefined){\n"		// ベースオブジェクトが初期化されていない
			+ "  debug(cls, baseClass);\n"
			+ "  throw new SyntaxError('Super class [' + baseClass.name + '] has no default constructor. InitSuper is required.');\n"
			+ "}\n"
			+ "_overrideFuncs(this);\n"											// メソッドにcallSuperを追加
//			+ "_t_overrideFuncs(this);\n"	// callSuperを改良している途中(2011-10-13)
			+ "if(this instanceof Error){ this.name = name; }\n"				// Errorオブジェクトの場合、nameを設定
			+ "}"
		eval(s);
		cls = eval(name);
		cls.prototype = _createBaseObject();	// 空のベースオブジェクトを作成
		cls.__pooConstructor = func;			// 実際のコンストラクタ(ユーザーが定義したもの)をセット
		return cls;
	};
})();

/* 別のアルゴリズム 2011-10-11
	// 初期のthisをベースクラスに渡していき、次々と処理されるパターン
	// スマートだが、引数を取る時にどうするかが未解決
	// またcallSuperが難しい
		"function " + name + "(){\n"
		+ "if(arguments.length === 1 && arguments[0] === thisIsForPrototype){ return; }\n"
		+ "var that = arguments[0] || this;\n"
		+ "this.constructor = cls;\n"
		+ "var baseClass = cls.prototype.constructor;\n"
		+ "var baseFunc = cls.prototype.constructor.__pooConstructor;\n"
		+ "if(baseFunc && baseFunc.length >= 0){ this.__pooBase = new baseClass(that); }\n"
		+ "cls.__pooConstructor.apply(that, arguments);\n"
		+ "}"
 */

		// ベースクラスがObjectならprotected用のオブジェクトとメソッドを作成

/* これだと__pooProtectedを介してアクセス可能 2011-10-12
		if(cls.prototype.constructor === Object){
			(function(){
				var _protected = {};

				var _checkProperCall = function(obj, caller) {
					// 本来のprotectedの呼び出しか？
					if(caller === obj.constructor.__pooConstructor){
						// コンストラクタ中での呼び出し
						// 厳密にはオブジェクトの一致まで検査できない
						return true;
					}
					for(var k in obj){
						if(obj.hasOwnProperty(k) && obj[k] instanceof Function){
							if(caller === obj[k]){ return true; }
						}
					}
					_throwError(new ReferenceError(
						"Protected property can not be referenced by outlier of the defined class."
					));
				};

				var _checkProtectedLevel = function(obj, name) {
					var p = obj.__pooProtected;
					if(!p.hasOwnProperty(name)){
						throw new ReferenceError("'" + name + "' is not defined as protected.");
					}
					if(!(obj instanceof p[name].owner)){
						throw new ReferenceError(
							"'" + name + "' is defined in superior class. The, " + this.constructor.name + " can not use it."
						);
					}
				};

				cls.prototype.protected = function(name, value) {
					var p = this.__pooProtected;
					if(!p.hasOwnProperty(name)){
						p[name] = {
							owner	: this.constructor,	// 最初に設定したクラスよりも基底クラスでは参照できなくする
							value	: null
						};
					}
					// より基底なクラスで再定義されたらownerを書き換える
					if(p[name].owner.prototype instanceof this.constructor){
						p[name].owner = this.constructor;
					}
					if(value !== undefined){ this.setProtected(name, value) }
				};

				cls.prototype.setProtected = function(name, value) {
					// protected()内でsetProtectedが呼ばれた際のcallerの調整
					var caller = arguments.callee.caller;
					if(caller === cls.prototype.protected){ caller = caller.caller }
					_checkProperCall(this, caller);
					_checkProtectedLevel(this, name);
					this.__pooProtected[name].value = value;
				};

				cls.prototype.getProtected = function(name) {
					_checkProperCall(this, arguments.callee.caller);
					_checkProtectedLevel(this, name);
					return this.__pooProtected[name].value;
				};

				cls.prototype.setP2 = function(name, value) {
					if(!_protected.hasOwnProperty(this)){ _protected[this] = {}; }
					_protected[this][name] = value;
				};

				cls.prototype.getP2 = function(name) {
					return _protected[this][name];
				};
			})();
		}
 */
