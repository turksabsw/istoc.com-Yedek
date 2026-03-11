#!/bin/bash

echo "Frappe_Marketplace güncelleniyor..."
git subtree pull --prefix=Frappe_Marketplace frappe main --squash

echo ""
echo "tradehubfront güncelleniyor..."
git subtree pull --prefix=tradehubfront tradehubfront main --squash

echo ""
echo "Tamamlandı!"
