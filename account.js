async function connectFerroAccount(config, onSession){
 if(!config?.url||!config?.publishableKey)return null;
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.49.4');
 const client=createClient(config.url,config.publishableKey,{
  auth:{storageKey:'ferro-feral-auth'}
 });
 client.auth.onAuthStateChange((_event,session)=>{
  setTimeout(()=>onSession(session?.user?.id??null),0);
 });
 return {
  signIn(){
   const redirectTo=new URL(location.pathname,location.origin).href;
   return client.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
  },
  signOut(){return client.auth.signOut({scope:'local'})},
  async load(){
   const {data,error}=await client.from('ferro_feral_progress').select('unlocked_level').maybeSingle();
   if(error)throw error;
   return data?.unlocked_level??0;
  },
  async save(level){
   const {data,error}=await client.rpc('ferro_feral_save_progress',{completed_level:level});
   if(error)throw error;
   return data;
  }
 };
}
