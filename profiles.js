(()=>{'use strict';
const $=id=>document.getElementById(id),config=window.EJS_CONFIG||{};
if(!window.supabase||!config.supabaseUrl||!config.supabaseAnonKey){$('profileNotice').textContent='Car profiles require the Supabase connection.';return}
const db=window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey,{auth:{storageKey:'sb-'+new URL(config.supabaseUrl).hostname.split('.')[0]+'-auth-token'}});
// Share the existing Supabase session storage key with the inventory manager.
let publicCars=[],ownerCars=[],ownerPhotos=[],current=null,active=0;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const signedUrls=new Map();
const url=path=>signedUrls.get(path)||'';
async function prepareUrls(pictures){
 // Refresh temporary links when data is reloaded; do not retain draft links after sign-out.
 signedUrls.clear();
 const paths=[...new Set((pictures||[]).map(p=>p.storage_path).filter(Boolean))];
 await Promise.all(paths.map(async path=>{
  const r=await db.storage.from('car-profile-photos').createSignedUrl(path,3600);
  if(!r.error&&r.data?.signedUrl)signedUrls.set(path,r.data.signedUrl);
 }));
}
const photos=(id,arr=ownerPhotos)=>arr.filter(p=>p.profile_id===id).sort((a,b)=>a.sort_order-b.sort_order);
const msg=(s)=>$('profileAdminMessage').textContent=s;
function imageBox(p,cls){const box=el('div',cls);if(p){const img=el('img');img.src=url(p.storage_path);img.alt='Vehicle photo';img.loading='lazy';box.append(img)}else box.append(el('span','profile-placeholder','EJ\'S GARAGE'));return box}
async function loadPublic(){const {data,error}=await db.from('car_profiles').select('*').eq('is_published',true).order('created_at',{ascending:false});if(error){$('profileNotice').textContent='Car profiles are not available yet. Database setup may be pending.';return}publicCars=data||[];const ids=publicCars.map(c=>c.id);let pictures=[];if(ids.length){const r=await db.from('car_profile_photos').select('*').in('profile_id',ids);if(!r.error)pictures=r.data||[]}await prepareUrls(pictures);renderCards(pictures);if(current){const found=publicCars.find(x=>x.id===current);if(found)showDetail(found,pictures);else closeDetail()}}
function renderCards(pictures){const grid=$('profileGrid');grid.replaceChildren();if(!publicCars.length){grid.append(el('div','profile-empty','Car profiles are coming soon. Check back for EJ’s vehicle stories.'));return}for(const c of publicCars){const card=el('article','profile-card');card.append(imageBox(photos(c.id,pictures).find(p=>p.is_cover)||photos(c.id,pictures)[0],'profile-cover'));const copy=el('div','profile-copy');copy.append(el('span','eyebrow',[c.year,c.model].filter(Boolean).join(' / ')||'INSIDE THE GARAGE'),el('h3','',c.name),el('p','',c.summary||'Explore this vehicle’s story.'));const btn=el('button','','VIEW CAR PROFILE ↗');btn.onclick=()=>showDetail(c,pictures);copy.append(btn);card.append(copy);grid.append(card)}}
function closeDetail(){current=null;$('profileDetail').hidden=true;$('profileGrid').hidden=false}
function showDetail(c,pictures){current=c.id;const detail=$('profileDetail');detail.hidden=false;$('profileGrid').hidden=true;detail.replaceChildren();const wrap=el('div','profile-detail'),back=el('button','profile-back','← ALL CAR PROFILES');back.onclick=closeDetail;wrap.append(back,el('h3','',c.name));const grid=el('div','profile-detail-grid'),left=el('div'),right=el('div');const pics=photos(c.id,pictures),cover=pics.find(p=>p.is_cover)||pics[0];if(!pics.some(p=>p.id===active))active=cover?.id||null;const shown=pics.find(p=>p.id===active)||cover;const main=imageBox(shown,'profile-cover profile-main-photo');left.append(main);const thumbs=el('div','profile-thumbs');pics.forEach(p=>{const b=el('button',p.id===shown?.id?'selected':'');const im=el('img');im.src=url(p.storage_path);im.alt='View vehicle photo';b.append(im);b.onclick=()=>{active=p.id;showDetail(c,pictures)};thumbs.append(b)});left.append(thumbs);const specs=el('div','profile-specs');[['YEAR',c.year],['MODEL',c.model],['ENGINE',c.engine],['DRIVETRAIN',c.drivetrain]].forEach(([k,v])=>{if(!v)return;const box=el('div');box.append(el('small','',k),el('strong','',v));specs.append(box)});right.append(el('span','eyebrow','VEHICLE PROFILE'),el('p','',c.summary||''),specs,el('h3','','VEHICLE HISTORY'),el('p','profile-history',c.history||'No history added yet.'));grid.append(left,right);wrap.append(grid);detail.append(wrap);detail.scrollIntoView({behavior:'smooth',block:'start'})}
async function authorized(){const {data:{user}}=await db.auth.getUser();if(!user)return false;const {data,error}=await db.from('inventory_admins').select('user_id').eq('user_id',user.id).maybeSingle();return !error&&!!data}
async function loadOwner(){if(!(await authorized()))return;const [a,b]=await Promise.all([db.from('car_profiles').select('*').order('created_at',{ascending:false}),db.from('car_profile_photos').select('*').order('sort_order')]);if(a.error||b.error){msg((a.error||b.error).message);return}ownerCars=a.data||[];ownerPhotos=b.data||[];await prepareUrls(ownerPhotos);renderOwnerList();renderPhotos()}
function renderOwnerList(){const list=$('profileAdminList');list.replaceChildren();ownerCars.forEach(c=>{const row=el('div','profile-admin-row'),info=el('div');info.append(el('strong','',c.name),el('p','muted',c.is_published?'Published':'Draft'));const actions=el('div','profile-owner-actions'),b=el('button','','EDIT'),del=el('button','danger-button','DELETE');b.type=del.type='button';b.onclick=()=>edit(c);del.onclick=()=>deleteProfile(c);actions.append(b,del);row.append(info,actions);list.append(row)});if(!ownerCars.length)list.append(el('p','muted','No car profiles yet. Create the first one below.'))}
// Delete the database record first so a failed database delete cannot erase live photos.
// Storage cleanup is performed only for paths recorded against this exact profile.
async function deleteProfile(c){
 if(!(await authorized())){msg('Owner authorization required.');return}
 const confirmation=prompt(`PERMANENT DELETE\n\nVehicle: ${c.name}\nThis removes the profile and all its photos. This cannot be undone.\n\nType DELETE to confirm:`);
 if(confirmation!=='DELETE'){if(confirmation!==null)msg('Deletion cancelled: confirmation did not match.');return}
 const buttons=[...document.querySelectorAll('#profileAdminList button')];buttons.forEach(b=>b.disabled=true);
 msg('Deleting vehicle profile…');
 try{
  const found=await db.from('car_profile_photos').select('storage_path').eq('profile_id',c.id);
  if(found.error)throw found.error;
  const paths=(found.data||[]).map(p=>p.storage_path).filter(path=>path.startsWith(c.id+'/'));
  if(paths.length!==(found.data||[]).length)throw new Error('Unexpected photo path; deletion stopped for review.');
  const result=await db.from('car_profiles').delete().eq('id',c.id).select('id');
  if(result.error)throw result.error;
  if(!result.data?.some(x=>x.id===c.id))throw new Error('Profile was not deleted. Verify owner permissions.');
  if($('profileId').value===c.id)clear();
  if(current===c.id)closeDetail();
  let cleanupError=null;
  for(let i=0;i<paths.length;i+=100){
   const r=await db.storage.from('car-profile-photos').remove(paths.slice(i,i+100));
   if(r.error){cleanupError=r.error;break}
  }
  await loadOwner();await loadPublic();
  msg(cleanupError?'Profile deleted, but some stored photos may remain. Contact the site administrator to clean up the orphaned images: '+cleanupError.message:'Vehicle profile and associated photos deleted.');
 }catch(e){msg('Deletion stopped: '+(e.message||String(e)));await loadOwner()}
 finally{buttons.forEach(b=>b.disabled=false)}
}
function clear(){ $('profileForm').reset();$('profileId').value='';$('profilePhotoManager').replaceChildren();msg('Ready for a new profile.')}
function edit(c){$('profileId').value=c.id;for(const [field,key] of [['profileName','name'],['profileYear','year'],['profileModel','model'],['profileEngine','engine'],['profileDrive','drivetrain'],['profileSummary','summary'],['profileHistory','history']])$(field).value=c[key]||'';$('profilePublished').checked=c.is_published;$('profileFiles').value='';renderPhotos();$('profileName').focus();msg('Editing '+c.name+'. Existing published profile stays online while you edit.')}
function renderPhotos(){const area=$('profilePhotoManager');area.replaceChildren();const id=$('profileId').value;if(!id)return;const list=photos(id);list.forEach((p,i)=>{const row=el('div','profile-photo-row'),im=el('img');im.src=url(p.storage_path);im.alt='Car photo';row.append(im);for(const [label,fn,disabled] of [['COVER',()=>setCover(p),p.is_cover],['←',()=>swap(p,list[i-1]),i===0],['→',()=>swap(p,list[i+1]),i===list.length-1],['REMOVE',()=>remove(p),false]]){const b=el('button','',label);b.type='button';b.disabled=disabled;b.onclick=fn;row.append(b)}if(p.is_cover)row.append(el('span','eyebrow','COVER'));area.append(row)})}
async function setCover(p){if(!(await authorized()))return;const id=p.profile_id;const previous=photos(id).find(x=>x.is_cover);if(previous?.id===p.id)return;const {error}=await db.from('car_profile_photos').update({is_cover:false}).eq('profile_id',id).eq('is_cover',true);if(error){msg(error.message);return}const r=await db.from('car_profile_photos').update({is_cover:true}).eq('id',p.id);if(r.error){if(previous)await db.from('car_profile_photos').update({is_cover:true}).eq('id',previous.id);msg('Could not change cover: '+r.error.message)}else msg('Cover photo updated.');await loadOwner();await loadPublic()}
async function swap(a,b){if(!b||!(await authorized()))return;const temp=-Date.now();for(const [id,sort_order] of [[a.id,temp],[b.id,a.sort_order],[a.id,b.sort_order]]){const r=await db.from('car_profile_photos').update({sort_order}).eq('id',id);if(r.error){msg(r.error.message);return}}await loadOwner();await loadPublic()}
async function remove(p){if(!confirm('Remove this vehicle photo?'))return;if(!(await authorized()))return;const replacement=p.is_cover?photos(p.profile_id).find(x=>x.id!==p.id):null;const r=await db.from('car_profile_photos').delete().eq('id',p.id);if(r.error){msg(r.error.message);return}if(replacement){const cover=await db.from('car_profile_photos').update({is_cover:true}).eq('id',replacement.id);if(cover.error)msg('Photo removed but new cover could not be set: '+cover.error.message)}const s=await db.storage.from('car-profile-photos').remove([p.storage_path]);if(s.error)msg('Photo removed from profile; storage cleanup failed: '+s.error.message);else if(!replacement)msg('Photo removed.');await loadOwner();await loadPublic()}
$('profileClear').onclick=clear;
$('profileForm').addEventListener('submit',async e=>{e.preventDefault();if(!(await authorized())){msg('Owner authorization required.');return}const files=[...$('profileFiles').files];if(files.length>12||files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024)){msg('Select up to 12 JPEG, PNG or WebP photos, each 10 MB or less.');return}const id=$('profileId').value;const payload={name:$('profileName').value.trim(),year:$('profileYear').value.trim(),model:$('profileModel').value.trim(),engine:$('profileEngine').value.trim(),drivetrain:$('profileDrive').value.trim(),summary:$('profileSummary').value.trim(),history:$('profileHistory').value.trim(),is_published:$('profilePublished').checked};if(!payload.name){msg('Vehicle name is required.');return}const save=$('profileSave');save.disabled=true;msg('Saving…');try{const r=id?await db.from('car_profiles').update(payload).eq('id',id).select().single():await db.from('car_profiles').insert(payload).select().single();if(r.error)throw r.error;const c=r.data;let existing=photos(c.id).length;const errors=[];for(const f of files){const ext=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg',path=`${c.id}/${crypto.randomUUID()}.${ext}`;const up=await db.storage.from('car-profile-photos').upload(path,f,{contentType:f.type,upsert:false});if(up.error){errors.push(up.error.message);continue}const link=await db.from('car_profile_photos').insert({profile_id:c.id,storage_path:path,sort_order:existing,is_cover:existing===0});if(link.error){errors.push(link.error.message);await db.storage.from('car-profile-photos').remove([path])}else existing++}await loadOwner();await loadPublic();edit(ownerCars.find(x=>x.id===c.id)||c);msg(errors.length?'Profile saved; some photos failed: '+errors.join('; '):'Profile saved successfully.');}catch(err){msg(err.message)}finally{save.disabled=false}});
$('adminOpen').addEventListener('click',()=>setTimeout(loadOwner,350));db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN')setTimeout(loadOwner,400);if(event==='SIGNED_OUT'){ownerCars=[];ownerPhotos=[];signedUrls.clear();$('profileAdminList').replaceChildren();$('profilePhotoManager').replaceChildren();clear();setTimeout(loadPublic,100)}});loadPublic();
})();