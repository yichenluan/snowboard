(() => {
  'use strict';
  const serviceOrigin='https://utteranc.es',repo='yichenluan/snowboard';
  const siteUrl=location.origin==='https://jinke.me'&&location.pathname.startsWith('/snowboard/')
    ?'https://jinke.me/snowboard/':'https://snowboardguide.cn/';
  const sessionKey='snowboard-utterances-session';

  // Match the official client/page-attributes/measure protocol, without running
  // third-party code in the parent page. Keep OAuth state out of guide exports.
  // https://github.com/utterance/utterances/tree/master/src
  let session='';
  const pageUrl=new URL(location.href),callbackSession=pageUrl.searchParams.get('utterances');
  try{session=localStorage.getItem(sessionKey)||'';}catch{}
  if(callbackSession!==null){
    session=callbackSession;
    try{localStorage.setItem(sessionKey,session);}catch{}
    pageUrl.searchParams.delete('utterances');
    try{history.replaceState(history.state,'',pageUrl.href);}catch{}
  }

  function mount(root,{lessonId,title}){
    // One alphanumeric search token; the non-hex terminator prevents a short
    // lesson ID matching a longer one in Utterances' substring title lookup.
    const term='snowboardlesson'+Array.from(new TextEncoder().encode(lessonId),n=>n.toString(16).padStart(2,'0')).join('')+'end';
    const lessonUrl=siteUrl+'#lesson='+encodeURIComponent(lessonId);
    let frame=null,observer=null,timer=null,destroyed=false;

    const status=document.createElement('p');
    status.className='comments-status';
    status.setAttribute('role','status');
    status.textContent='滚动到这里后加载本课讨论。';
    const actions=document.createElement('div');
    actions.className='comments-actions';
    const retry=document.createElement('button');
    retry.type='button';
    retry.className='quiet-button';
    retry.textContent='重新加载评论';
    retry.hidden=true;
    const onlineLink=document.createElement('a');
    onlineLink.href=lessonUrl;
    onlineLink.textContent='到正式课程页登录和发表';
    const githubLink=document.createElement('a');
    githubLink.href=`https://github.com/${repo}/issues?${new URLSearchParams({q:`is:issue in:title "${term}"`})}`;
    githubLink.textContent='在 GitHub 查看本课讨论 ↗';
    for(const link of [onlineLink,githubLink]){link.target='_blank';link.rel='noopener noreferrer';}
    actions.append(retry,onlineLink,githubLink);
    root.replaceChildren(status,actions);
    if(/^https?:$/.test(location.protocol)&&location.origin!==new URL(siteUrl).origin){
      const preview=document.createElement('p');
      preview.className='comments-preview';
      preview.textContent='当前为预览页面；请到正式课程页登录和发表。';
      root.append(preview);
    }

    function message(text,canRetry=true){
      status.textContent=text;
      status.hidden=false;
      retry.hidden=!canRetry;
    }
    function stopFrame(){
      clearTimeout(timer);
      window.removeEventListener('message',resize);
      frame?.remove();
      frame=null;
    }
    function resize(event){
      if(destroyed||event.origin!==serviceOrigin||!frame||event.source!==frame.contentWindow)return;
      const data=event.data;
      if(!data||data.type!=='resize'||typeof data.height!=='number'||!Number.isFinite(data.height)||data.height<=0||data.height>1000000)return;
      frame.style.height=Math.ceil(data.height)+'px';
      clearTimeout(timer);
      status.hidden=true;
      retry.hidden=true;
    }
    function load(){
      if(destroyed)return;
      observer?.disconnect();
      observer=null;
      stopFrame();
      if(!/^https?:$/.test(location.protocol)){
        message('离线网页不加载评论。请联网打开正式课程页，查看或填写本课讨论。',false);
        return;
      }
      if(navigator.onLine===false){
        message('当前未联网。恢复网络后可重新加载评论，或打开正式课程页。');
        return;
      }
      message('正在加载 GitHub 评论…',false);
      frame=document.createElement('iframe');
      frame.className='comments-frame';
      frame.title=title+' · 公开笔记与讨论';
      frame.setAttribute('scrolling','no');
      frame.referrerPolicy='no-referrer';
      Object.assign(frame.style,{width:'100%',height:'320px',border:'0',colorScheme:'light'});
      frame.src=`${serviceOrigin}/utterances.html?${new URLSearchParams({
        repo,'issue-term':term,url:lessonUrl,origin:location.origin,
        title:title+' · 雪上笔记',theme:'github-light',session
      })}`;
      window.addEventListener('message',resize);
      root.append(frame);
      timer=setTimeout(()=>message('评论仍在加载。可以稍后重试，或到 GitHub 查看本课讨论。'),15000);
    }
    retry.onclick=load;
    onlineLink.hidden=location.origin===new URL(siteUrl).origin&&navigator.onLine!==false;
    if(!/^https?:$/.test(location.protocol)||navigator.onLine===false){
      load();
    }else if(window.IntersectionObserver){
      observer=new window.IntersectionObserver(entries=>{if(observer&&entries.some(entry=>entry.isIntersecting))load();},{rootMargin:'240px'});
      observer.observe(root);
    }else{
      load();
    }
    return {destroy(){
      if(destroyed)return;
      destroyed=true;
      observer?.disconnect();
      stopFrame();
      retry.onclick=null;
      root.replaceChildren();
    }};
  }
  window.SnowComments={mount};
})();
