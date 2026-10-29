# YouCam API notes (read from docs.perfectcorp.com OpenAPI bundles, 2026-10-29)

Our own summary of the published reference. See https://docs.perfectcorp.com/reference/<feature> for the source.

- **Task create**: `POST /s2s/v2.0/task/<feature>` → `{status:200, data:{task_id}}`. Errors 400 `{status, error, error_code}` where error_code ∈ InvalidParameters, CreditInsufficiency, InvalidStyleGroup, InvalidStyle, BadRequest. 401 `{status:401, error:"Unauthorized", error_code:"InvalidAccessToken"}`.
- **Task poll**: `GET /s2s/v2.0/task/<feature>/<task_id>` → `{status:200, data:{error:null, results:{url}, task_status:"success"}}`. Result URL valid **2 hours** (file retention page). Uploaded files and task ids are kept 30 days unless deleted.
- **Task delete**: `POST /s2s/v2.0/task/delete {task_id}` deletes a finished task with its input files and outputs (Task Management reference).
- **File**: `POST /s2s/v2.0/file {files:[{content_type,file_name,file_size}]}` → `data.files[0].file_id` + `requests[0]{method:"PUT",url,headers}`.
- **cloth-v4**: `src_file_url|src_file_id`, `ref_file_url|ref_file_id`, `garment_category` ∈ full_body, lower_body, upper_body, shoes, auto, outer (required), optional `change_shoes` (bool, default true), `filter_multi_person` (off|normal|strict). Clothes overview lists units for V2/V3 only (2 each); V4 not listed. Lower-body refs: "only actual worn outfits are supported, not standalone product images". Limits: max side 4096, <10 MB, jpg/png.
- **shoes-transfer**: `src_file_url|id`, `ref_file_url|id`, `gender` (female|male, required), `style` ("random" in example). Output 1008×1344. Errors include invalid_parameter (gender/style), error_no_face.
- **bag**: same as shoes; style ∈ style_parisian_chic, style_urban_chic, style_mediterranean_chic, style_art_deco_style, or random by default. Output 1104×1472. 2 units.
- **fabric**: `{template_id, src_file_url|src_file_id}`; templates `GET /s2s/v2.0/task/template/fabric?page_size=&starting_token=` → `data.templates[{id,thumb,title,category_name}]`, `data.next_token`. jpg/jpeg only. 2 units.
- **2d-vto/necklace**: schema = allOf[ anyOf(`src_file_url|src_file_id`, optional `srcmsk_file_url|id`, `ref_file_urls[]|ref_file_ids[]`), required `source_info{name, mask_name?}`, required `object_infos[{name, parameter{necklace_need_remove_background, necklace_anchor_point, necklace_wearing_location, necklace_shadow_intensity, necklace_ambient_light_intensity}}]` ]. 1 unit. Needs a front selfie with the neck ≥15% of image width.
- **2d-vto/earring**: same shape plus `refmsk_file_urls|ids`; object_infos[{name, mask_name}].
- **Credit**: `GET /s2s/v1.0/client/credit` → `{status, results:[{id,type,amount(deprecated),amount_dec,expiry}]}` (note: `results`, not `data`). `GET /s2s/v2.0/credit/feature-cost` → `{status, result:{next_token, skus:[{description,amount,unit,proc_unit,run_task_url}]}}`.
- **Rate limit**: 250 req / 300 s per IP and per token, ~5 QPS recommended, 429 when exceeded.
