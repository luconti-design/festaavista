import {afterEach,expect,test,vi} from 'vitest';
import {sharePreviewApi,SHARE_PREVIEW_MESSAGE} from '../src/services/sharePreviewApi';
afterEach(()=>vi.unstubAllGlobals());
test('share preview reads the packaged real snapshot with an explicit non-live warning',async()=>{
 const snapshot={rows:[{'Nome da casa':'Fixture de teste'}],fetchedAt:'2026-10-20T12:00:00Z',stale:false};
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>snapshot});vi.stubGlobal('fetch',fetcher);
 const data=await sharePreviewApi.getQuotes();expect(fetcher).toHaveBeenCalledWith('./preview-data.json',{cache:'no-store'});expect(data.rows).toEqual(snapshot.rows);expect(data.warning).toBe(SHARE_PREVIEW_MESSAGE);
});
test('public share preview never accepts private uploads or contributions',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 await expect(sharePreviewApi.beginContribution()).rejects.toThrow('não recebe');
 await expect(sharePreviewApi.submitContribution({type:'manual',ticket:{token:'x',issued:0,expires:0,signature:'x'},files:[],truth:true,consent:true})).rejects.toThrow('não recebe');
 await expect(sharePreviewApi.uploadContributionChunk({ticket:{token:'x',issued:0,expires:0,signature:'x'},slot:0,name:'x.pdf',type:'application/pdf',size:1,index:0,total:1,data:'eA=='})).rejects.toThrow('não recebe');
 expect(fetcher).not.toHaveBeenCalled();
});
