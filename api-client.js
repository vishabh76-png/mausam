const nativeFetch=window.fetch.bind(window);
window.fetch=(input,options={})=>{if(typeof input==='string'&&input.startsWith('/api/')){const base=window.MAUSAM_API_BASE||'';return nativeFetch(base+input,{...options,credentials:base?'omit':options.credentials});}return nativeFetch(input,options);};
