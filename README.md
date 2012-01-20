PseudoClass
===========
Ver.2 R.2011-10-13  
**Pseudo** Object Oriented implementation

Overview
--------
- 現時点ではObjectおよびError(SyntaxErrorなども含む)の継承を想定
- 追加されるプロパティ
    - \_\_pooBase          : 親オブジェクト(Class#\_\_pooBase)
    - \_\_pooConstructor   : ユーザー定義コンストラクタ、というかイニシャライザ(Class.\_\_pooConstructor)
    - callSuper            : object.getValue.callSuper()でスーパークラスのメソッド呼び出し
    - initSuper          : 親オブジェクトの初期化。
                           親オブジェクトのイニシャライザが引数を取る場合は現在のイニシャライザからコールする。
    - protected          : Protected変数の宣言および初期化
    - setProtected       : Protected変数への代入
    - getProtected       : Protected変数の取得
    - callProtectedMethod: Protectedメソッドのコール(定義はprotectedかsetProtectedで行う)
                           Protected変数はクロージャ内にあるので原理的に外部からはアクセスできない

Usage
-----
### 基本的な使い方
クラスを定義する基本的な例。

- ベースクラスの定義

        PseudoClass.define("BaseClass", Object, function(value) {
            // コンストラクタに相当。ここでメンバを定義する
            var mValue = value;                             // プライベート変数を定義
            var privateMethod = function(){...};            // プライベートメソッドを定義
            this.getValue = function() { return value; }    // パブリックメソッドでプライベート変数にアクセス
        });

- 派生クラスの定義

        PseudoClass.define("SubClass", BaseClass, function(value) {
            initSuper(value);                               // ベースクラスを初期化
            ...
        });

### Protected関連
- 2011-10-13から導入されたProtected変数

    protected等をコールしたメソッドがオブジェクトのプロパティかどうかからチェックしているため、
    呼び出す場所によっては適切に使用されていてもReferenceErrorになる事がある(例：jQuery.each()の中など)  
    この事象を回避するには変数を操作するときはローカル変数を使い、最終的にprotectedに格納する。
    リテラルの場合が面倒かも・・・

Exceptions
----------
### TypeError
- The arg1 of initSuper() must be PseudoClass object. [..]  
  initSuperをコールするときに第一引数に自オブジェクトを指定しなかった

### SyntaxError
- initSuper() is only used in PseudoClass constructor.  
  initSuperをイニシャライザ以外の場所からコールした
- Constructor must be called with 'new'.
- Super class [..] has no default constructor. InitSuper is required.

### ReferenceError
- Super class does not have function '..'.
- Protected property can not be referenced by outlier of the defined class.
- '..' is not defined as protected.
- '..' is defined in superior class. The, '..' can not use it.
