import {escape} from './content.mjs';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function renderFounders(root,founders=[]){
 if(!Array.isArray(founders))throw Error('Founders must be a list');const cards=[];
 for(const entry of founders){const f=typeof entry==='string'?{name:entry}:entry;if(!f||typeof f.name!=='string'||!f.name.trim())continue;
 const name=f.name.trim(),initials=name.split(/\s+/).slice(0,2).map(x=>x[0]).join('');
 let portrait='<div class="about-founder-placeholder" role="img" aria-label="'+escape(name)+' — initials placeholder, not a portrait"><span aria-hidden="true">'+escape(initials)+'</span><small aria-hidden="true">FOUNDER PORTRAIT TO FOLLOW</small></div>';
 if(f.portrait&&f.portrait_confirmed===true){if(!/^assets\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/.test(f.portrait))throw Error('Founder portraits must be local approved image assets');await readFile(join(root,'src',f.portrait));portrait='<img src="'+escape(f.portrait)+'" alt="'+escape(name)+', Co-Founder of VAYRIFT Studio" width="720" height="840" loading="lazy" decoding="async">';}
 let linkedin='';if(f.linkedin){const url=new URL(f.linkedin);if(url.protocol!=='https:'||url.hostname!=='www.linkedin.com'||!url.pathname.startsWith('/in/')||url.username||url.password)throw Error('Invalid founder LinkedIn profile');linkedin='<a class="about-founder-link" href="'+escape(url.href)+'" target="_blank" rel="noopener noreferrer" aria-label="'+escape(name)+' on LinkedIn (opens in a new tab)">LinkedIn <span aria-hidden="true">↗</span></a>';}
 cards.push('<article class="about-founder-card" aria-label="'+escape(name)+'"><div class="about-founder-portrait">'+portrait+'</div><div class="about-founder-info"><p class="about-founder-role">'+escape(f.role||'Co-Founder, VAYRIFT Studio')+'</p><h3 class="founder-public-name">'+escape(name)+'</h3>'+(f.bio?'<p class="about-founder-bio">'+escape(f.bio)+'</p>':'')+linkedin+'</div></article>');}
 if(!cards.length)return '';
 return '<section class="about-section about-founders" id="founders" aria-labelledby="founders-title"><div class="about-section-heading"><div><p class="about-kicker">03 / THE PEOPLE BEHIND THE STUDIO</p><h2 id="founders-title">Different perspectives.<br><em>A shared point of view.</em></h2></div><p>Two founders. A direct conversation.<br>You know who you’re working with.</p></div><div class="about-founder-grid">'+cards.join('')+'</div></section>';
}
