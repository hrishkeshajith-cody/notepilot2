# ADD THESE ENDPOINTS TO server.py after the existing /study-packs endpoints

@api_router.get("/community/study-packs")
async def get_community_study_packs(request: Request):
    try:
        result = supabase.table("study_packs").select("id, user_id, chapter_title, subject, grade, created_at, summary").order("created_at", desc=True).limit(50).execute()
        packs = result.data or []
        # Attach display name for each pack
        user_ids = list(set(p["user_id"] for p in packs))
        users_result = supabase.table("users").select("user_id, name").in_("user_id", user_ids).execute()
        users_map = {u["user_id"]: u["name"] for u in (users_result.data or [])}
        for pack in packs:
            pack["author_name"] = users_map.get(pack["user_id"], "Anonymous")
        return packs
    except Exception as e:
        logger.error(f"Community study packs error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve community study packs")


@api_router.get("/community/study-packs/{pack_id}")
async def get_community_study_pack(pack_id: str):
    try:
        result = supabase.table("study_packs").select("*").eq("id", pack_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Study pack not found")
        pack = result.data[0]
        user_result = supabase.table("users").select("name").eq("user_id", pack["user_id"]).execute()
        pack["author_name"] = user_result.data[0]["name"] if user_result.data else "Anonymous"
        return pack
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get community pack error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve study pack")


@api_router.get("/community/flashcards")
async def get_community_flashcards(request: Request):
    try:
        result = supabase.table("custom_flashcards").select("set_id, user_id, title, description, created_at").order("created_at", desc=True).limit(50).execute()
        sets = result.data or []
        user_ids = list(set(s["user_id"] for s in sets))
        users_result = supabase.table("users").select("user_id, name").in_("user_id", user_ids).execute()
        users_map = {u["user_id"]: u["name"] for u in (users_result.data or [])}
        for s in sets:
            s["author_name"] = users_map.get(s["user_id"], "Anonymous")
        return sets
    except Exception as e:
        logger.error(f"Community flashcards error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve community flashcards")
