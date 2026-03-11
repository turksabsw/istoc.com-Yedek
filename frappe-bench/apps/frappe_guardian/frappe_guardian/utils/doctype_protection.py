import frappe
import os
import json

def get_all_child_table_overrides():
    """
    Tüm installed app'lerdeki child table'ları dinamik olarak tarar.
    override_doctype_class hook'u için dict döndürür.
    Bu sayede orphan detection'dan korunurlar.
    """
    overrides = {}
    
    try:
        apps = frappe.get_installed_apps()
    except:
        return overrides
    
    for app in apps:
        try:
            app_path = frappe.get_app_path(app)
            
            # App içindeki tüm klasörleri tara
            for item in os.listdir(app_path):
                item_path = os.path.join(app_path, item)
                if not os.path.isdir(item_path):
                    continue
                
                # doctype klasörü var mı?
                doctype_path = os.path.join(item_path, "doctype")
                if not os.path.isdir(doctype_path):
                    continue
                
                # Her doctype klasörünü kontrol et
                for dt_folder in os.listdir(doctype_path):
                    if dt_folder.startswith("_"):
                        continue
                    
                    dt_path = os.path.join(doctype_path, dt_folder)
                    if not os.path.isdir(dt_path):
                        continue
                        
                    json_path = os.path.join(dt_path, f"{dt_folder}.json")
                    py_path = os.path.join(dt_path, f"{dt_folder}.py")
                    
                    if not os.path.exists(json_path) or not os.path.exists(py_path):
                        continue
                    
                    try:
                        with open(json_path) as f:
                            data = json.load(f)
                        
                        # Tüm non-custom DocType'ları ekle (child table + normal)
                        if data.get("custom") != 1:
                            dt_name = data.get("name")
                            class_name = _get_class_name_from_file(py_path)
                            
                            if class_name and dt_name:
                                module_name = f"{app}.{item}.doctype.{dt_folder}.{dt_folder}.{class_name}"
                                overrides[dt_name] = module_name
                    except:
                        continue
        except:
            continue
    
    return overrides


def _get_class_name_from_file(py_path):
    """Python dosyasından Document class adını çıkar"""
    try:
        with open(py_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("class ") and "Document" in line:
                    # "class ClassName(Document):" -> "ClassName"
                    class_name = line.split("class ")[1].split("(")[0].strip()
                    return class_name
    except:
        pass
    return None


def sync_missing_doctypes():
    """
    Veritabanında eksik olan DocType'ları JSON dosyalarından yükler.
    after_migrate hook'u olarak çalışır.
    """
    try:
        apps = frappe.get_installed_apps()
    except:
        return
    
    restored = []
    
    for app in apps:
        try:
            app_path = frappe.get_app_path(app)
            
            for item in os.listdir(app_path):
                item_path = os.path.join(app_path, item)
                if not os.path.isdir(item_path):
                    continue
                
                doctype_path = os.path.join(item_path, "doctype")
                if not os.path.isdir(doctype_path):
                    continue
                
                for dt_folder in os.listdir(doctype_path):
                    if dt_folder.startswith("_"):
                        continue
                    
                    dt_path = os.path.join(doctype_path, dt_folder)
                    if not os.path.isdir(dt_path):
                        continue
                    
                    json_path = os.path.join(dt_path, f"{dt_folder}.json")
                    
                    if not os.path.exists(json_path):
                        continue
                    
                    try:
                        with open(json_path) as f:
                            data = json.load(f)
                        
                        dt_name = data.get("name")
                        
                        # Veritabanında yoksa ekle
                        if dt_name and not frappe.db.exists("DocType", dt_name):
                            doc = frappe.get_doc(data)
                            doc.flags.ignore_permissions = True
                            doc.flags.ignore_links = True
                            doc.flags.ignore_mandatory = True
                            doc.insert(ignore_if_duplicate=True)
                            restored.append(dt_name)
                    except Exception as e:
                        # Hata olursa sessizce devam et
                        continue
        except:
            continue
    
    if restored:
        frappe.db.commit()
        print(f"  [Guardian] Restored: {', '.join(restored)}")
    
    return restored
