import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {build,root} from '../scripts/build.mjs';
import {renderFounders} from '../scripts/about-content.mjs';

test('About page contains supplied founder identities, seven sections and accurate services',async()=>{
 await mkdir(join(root,'qa/about'),{recursive:true});const out=await mkdtemp(join(root,'qa/about/build-'));
 try{await build({outDir:out});const html=await readFile(join(out,'about.html'),'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/<section\b/g)||[]).length,6);assert.match(html,/Two minds\./);assert.match(html,/One vision\./);assert.match(html,/Endless possibilities\./);assert.match(html,/Let’s create/);
 for(const name of ['Manas Vignesh','Siddharth Lagisetty'])assert.ok(html.includes(name));
 assert.match(html,/https:\/\/www.linkedin.com\/in\/manas-vignesh\//);assert.match(html,/https:\/\/www.linkedin.com\/in\/siddharth-lagisetty-1b31b63bb\//);assert.match(html,/MLR Institute of Technology/);assert.match(html,/Center for Innovation and Entrepreneurship/);
 assert.equal((html.match(/class="about-founder-placeholder"/g)||[]).length,2);assert.equal((html.match(/FOUNDER PORTRAIT TO FOLLOW/g)||[]).length,2);assert.match(html,/On-site photography and videography are not included/);assert.match(html,/existing photographs and visual assets/);assert.ok(!html.includes('{{'));assert.ok(!/CEO|CTO|Chief|graduated|award-winning|our clients|trusted by/i.test(html));
 assert.ok(html.includes('href="work.html"'));assert.ok(html.includes('href="contact.html"'));assert.ok(html.includes('href="pricing.html"'));
 }finally{await rm(out,{recursive:true,force:true});}
});
test('founder data is empty-safe and escaped; only profile links from LinkedIn are accepted',async()=>{
 assert.equal(await renderFounders(root,[]),'');assert.equal(await renderFounders(root,[{},null,{name:''}]),'');const result=await renderFounders(root,[{name:'Controlled <Name>',bio:'Escaped <script> text'}]);assert.match(result,/Controlled &lt;Name&gt;/);assert.match(result,/Escaped &lt;script&gt;/);assert.ok(!result.includes('<script>'));
 await assert.rejects(renderFounders(root,[{name:'Controlled',linkedin:'javascript:alert(1)'}]));await assert.rejects(renderFounders(root,[{name:'Controlled',linkedin:'https://example.test/in/wrong-person/'}]));
});
test('unconfirmed photos remain placeholders and confirmed portrait paths reject remote or traversal input',async()=>{
 const unconfirmed=await renderFounders(root,[{name:'Controlled Example',portrait:'not-a-real-file.png',portrait_confirmed:false}]);assert.match(unconfirmed,/initials placeholder, not a portrait/);assert.ok(!unconfirmed.includes('<img'));
 for(const portrait of ['https://example.test/portrait.png','../private.png','assets/../private.png'])await assert.rejects(renderFounders(root,[{name:'Controlled Example',portrait,portrait_confirmed:true}]));
});
