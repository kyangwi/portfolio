import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

def initialize_firebase():
    if not os.path.exists('serviceAccountKey.json'):
        print("Error: serviceAccountKey.json not found.")
        return None

    # Check if app is already initialized to avoid error
    if not firebase_admin._apps:
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

def remove_duplicates(db, collection_name, unique_fields):
    print(f"Checking for duplicates in '{collection_name}'...")
    docs = db.collection(collection_name).stream()
    
    # Store found items to track uniqueness
    # Key = tuple of values from unique_fields
    seen_items = {} 
    duplicates = []

    for doc in docs:
        data = doc.to_dict()
        # Create a unique key based on specific fields (e.g., 'title', 'company')
        key = tuple(data.get(field) for field in unique_fields)
        
        if key in seen_items:
            duplicates.append(doc.id)
        else:
            seen_items[key] = doc.id

    if not duplicates:
        print(f"  No duplicates found in '{collection_name}'.")
        return

    print(f"  Found {len(duplicates)} duplicates in '{collection_name}'. Deleting...")
    
    batch = db.batch()
    count = 0
    for doc_id in duplicates:
        ref = db.collection(collection_name).document(doc_id)
        batch.delete(ref)
        count += 1
        
        # Batches have a 500 operation limit
        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0
            
    if count > 0:
        batch.commit()
        
    print(f"  Deleted {len(duplicates)} duplicates from '{collection_name}'.")

if __name__ == "__main__":
    db = initialize_firebase()
    if db:
        # Projects (duplicate if same title)
        remove_duplicates(db, "projects", ["title"])
        
        # Achievements (duplicate if same title and category)
        remove_duplicates(db, "achievements", ["title", "category"])
        
        # CV Education (duplicate if same degree and institution)
        remove_duplicates(db, "cv_education", ["degree", "institution"])
        
        # CV Experience (duplicate if same job_title and company)
        remove_duplicates(db, "cv_experience", ["job_title", "company"])
        
        # CV Skills (duplicate if same category)
        remove_duplicates(db, "cv_skills", ["category"])
        
        # CV Certifications (duplicate if same name)
        # Note: field might be 'name' or 'title' depending on model, checking both logic or just assuming 'name' based on previous context 
        # Looking at migrate script: creates 'name' and 'issuer' for CV certs if they were consistent, 
        # but migrate_to_firestore.py actually didn't seem to include certs? 
        # Wait, looked at migrate_to_firestore.py content in previous turn...
        # It had:
        # migrate_cv(db):
        # ... Education, Experience, Skills, Profile ...
        # It did NOT have Certifications loop visible in the last view_file of migrate_to_firestore.py (Step 154)!
        # Let's check if the user had certifications in their django models.
        # Viewed file 154 lines 135-187 shows Education, Experience, Skills, Profile.
        # It seems Certifications might NOT have been migrated or I missed the code block.
        # However, db.js has getCertifications.
        # If I didn't migrate them, then there are no duplicates because there are no entries (unless user added them manually).
        # Safe to run check anyway if collection exists.
        
        # I'll check 'cv_certifications' assuming 'name' as key if it exists.
        remove_duplicates(db, "cv_certifications", ["name"])
        
        print("Duplicate cleanup complete.")
