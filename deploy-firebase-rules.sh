#!/bin/bash
# deploy-firebase-rules.sh
# Quick script to deploy Firebase security rules

echo "🔥 Firebase Rules Deployment Script"
echo "===================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
    echo "✅ Firebase CLI installed!"
    echo ""
fi

# Check if logged in
echo "🔐 Checking Firebase authentication..."
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Firebase"
    echo "🔑 Logging in..."
    firebase login
    echo ""
fi

# Check if project is selected
echo "📁 Checking Firebase project..."
PROJECT=$(firebase use 2>&1 | grep "Active Project" | awk '{print $4}')
if [ -z "$PROJECT" ]; then
    echo "❌ No Firebase project selected"
    echo "📋 Available projects:"
    firebase projects:list
    echo ""
    echo "🎯 Select a project:"
    firebase use --add
    echo ""
fi

# Deploy rules
echo "🚀 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firebase rules deployed successfully!"
    echo ""
    echo "📝 What was deployed:"
    echo "  - Fixed activityLogs collection permissions"
    echo "  - Fixed auditLogs collection permissions"
    echo "  - All authenticated users can now:"
    echo "    ✓ Read activity logs"
    echo "    ✓ Create activity logs"
    echo "    ✓ Admins have full control"
    echo ""
    echo "🎉 The 'Missing or insufficient permissions' error is now fixed!"
    echo ""
    echo "⏰ Note: Changes may take 1-2 minutes to propagate"
    echo "🔄 Hard refresh your browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "🔍 Common issues:"
    echo "  1. Wrong Firebase project selected"
    echo "  2. Insufficient permissions on the project"
    echo "  3. Network connectivity issues"
    echo ""
    echo "💡 Try:"
    echo "  firebase use --add    # Select correct project"
    echo "  firebase login        # Re-authenticate"
fi

echo ""
echo "📚 Next steps:"
echo "  1. Test locally: npm run dev"
echo "  2. Deploy app: vercel --prod"
echo ""
