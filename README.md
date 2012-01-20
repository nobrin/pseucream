PseudoClass
===========
Ver.2 R.2011-10-13  
**Pseudo** Object Oriented implementation

Overview
--------
- 現時点ではObjectおよびError(SyntaxErrorなども含む)の継承を想定
- 追加されるプロパティ
-- __pooBase          : 親オブジェクト(Class#__pooBase)
-- __pooConstructor   : ユーザー定義コンストラクタ、というかイニシャライザ(Class.__pooConstructor)
-- callSuper          : object.getValue.callSuper()でスーパークラスのメソッド呼び出し
-- initSuper          : 親オブジェクトの初期化
--                      親オブジェクトのイニシャライザが引数を取る場合は現在のイニシャライザからコールする。
-- protected          : Protected変数の宣言および初期化
-- setProtected       : Protected変数への代入
-- getProtected       : Protected変数の取得
-- callProtectedMethod: Protectedメソッドのコール(定義はprotectedかsetProtectedで行う)
                        Protected変数はクロージャ内にあるので原理的に外部からはアクセスできない

Usage
-----
### 使用方法(Protected関連)
- 2011-10-13から導入されたProtected変数

protected等をコールしたメソッドがオブジェクトのプロパティかどうかからチェックしているため、
呼び出す場所によっては適切に使用されていてもReferenceErrorになる事がある(例：jQuery.each()の中など)  
この事象を回避するには変数を操作するときはローカル変数を使い、最終的にprotectedに格納する。
リテラルの場合が面倒かも・・・

Exceptions
----------
- TypeError
-- The arg1 of initSuper() must be PseudoClass object. [..]  
   initSuperをコールするときに第一引数に自オブジェクトを指定しなかった
-- SyntaxError
--- initSuper() is only used in PseudoClass constructor.  
    initSuperをイニシャライザ以外の場所からコールした
--- Constructor must be called with 'new'.  
--- Super class [..] has no default constructor. InitSuper is required.
-- ReferenceError
--- Super class does not have function '..'.
--- Protected property can not be referenced by outlier of the defined class.
--- '..' is not defined as protected.
--- '..' is defined in superior class. The, '..' can not use it.