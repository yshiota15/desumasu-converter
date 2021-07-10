let scrollFrom = null; //呼び出し元記憶用
let timeoutId = 0; //タイムアウトの破棄用

//スクロール同期制御類
let handleScroll = (callFrom) => {
    //呼び出し元をセットする
    if(scrollFrom === null){
        scrollFrom = callFrom;
    }
    //呼び出し元が違うなら何もしない
    if(scrollFrom !== callFrom) return;

    //タイムアウトが設定されているなら破棄する
    if(timeoutId !== 0) clearTimeout(timeoutId);
    //タイムアウトを設定、timeoutと呼び出し元を初期化
    timeoutId = setTimeout(()=>{
        timeoutId = 0;
        scrollFrom = null;
    }, 100);

    //スクロール率を設定
    const basis = document.getElementById(callFrom);
    const scrollRatio = basis.scrollTop / (basis.scrollHeight - basis.clientHeight);
    //スクロール実行
    const elements = document.getElementsByClassName("box");
    for(let i = 0; i < elements.length; i++){
        //呼び出し元は操作しない
        if(elements[i].id === callFrom) continue;
        //要素をscroll
        elements[i].scrollTop =
            (elements[i].scrollHeight - elements[i].clientHeight) * scrollRatio;
    }
}