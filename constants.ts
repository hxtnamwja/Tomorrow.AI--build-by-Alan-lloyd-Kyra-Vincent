
import { Demo, Subject, Language, Layer } from './types';

export const DICTIONARY = {
  en: {
    appTitle: "Tomorrow",
    explore: "Explore",
    bounties: "Bounties",
    upload: "Upload",
    admin: "Admin",
    profile: "Profile",
    searchPlaceholder: "Search demos (Cmd+K)...",
    
    // Auth & Roles
    loginTitle: "Select Identity",
    loginSubtitle: "Choose your access level to enter the laboratory.",
    roleUser: "Researcher",
    roleUserDesc: "Browse demos, view code, create or join communities.",
    roleGeneralAdmin: "Chief Administrator",
    roleGeneralAdminDesc: "Manage General Library and oversee all Communities.",
    welcomeBack: "Welcome back,",
    logout: "Log Out",
    accessLevel: "Access Level",
    
    // Profile
    profileTitle: "Researcher Profile",
    accountType: "Account Type",
    memberSince: "Member Since",
    contributions: "Contributions",
    createCommunity: "Create Community",
    myCommunities: "My Communities",
    communityStatus: "Status",
    
    subjects: "Subjects",
    all: "All Categories",
    open: "Open",
    details: "Details",
    code: "Source Code",
    aiHelper: "AI Helper",
    concept: "Scientific Concept",
    refresh: "Refresh",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
    close: "Close",
    uploadTitle: "Submit New Demo",
    stepInfo: "Basic Info",
    stepEditor: "Code Editor",
    stepPreview: "Preview",
    titleLabel: "Title",
    authorLabel: "Author",
    descLabel: "Description",
    subjectLabel: "Category / Subject",
    coverImage: "Cover Image",
    uploadCover: "Upload Cover",
    next: "Next",
    back: "Back",
    submit: "Submit",
    pending: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    adminDashboard: "Governance Hub",
    approve: "Approve",
    reject: "Reject",
    statsTotal: "Total Demos",
    statsPending: "Pending Review",
    statsUsers: "Active Users",
    emptyPending: "No pending items found.",
    aiChatTitle: "AI Lab Assistant",
    aiChatPlaceholder: "Ask about science or demos...",
    send: "Send",
    successMsg: "Operation successful!",
    uploadSuccessMsg: "Upload successful! Your demo has been submitted for review and will be published after admin approval.",
    physics: "Physics",
    chemistry: "Chemistry",
    mathematics: "Mathematics",
    biology: "Biology",
    computerScience: "Computer Science",
    astronomy: "Astronomy",
    earthScience: "Earth Science",
    creativeTools: "Creative Tools",
    // New translations
    layerGeneral: "General Library",
    layerCommunity: "Community Hub",
    addCategory: "New Category",
    addSubCategory: "Add Sub-category",
    deleteCategory: "Delete",
    enterCategoryName: "Enter category name:",
    communityRoot: "Community Root",
    selectLayer: "Select Layer",
    confirmDeleteCat: "Delete this category and all its contents?",
    confirmDeleteBounty: "Delete this bounty permanently?",
    confirmDeleteDemo: "Delete this demo?",
    confirmDeleteDemoToArchive: "Are you sure you want to delete this demo? It will be moved to the archive.",
    // Bounty
    bountyHall: "Bounty Hall",
    bountyDesc: "Explore and solve open scientific challenges to earn rewards.",
    createBounty: "Create Bounty",
    reward: "Reward",
    // Community Features
    communityHall: "Community Hall",
    selectCommunity: "Select Community",
    joinByCode: "Join by Code",
    enterCode: "Enter 12-digit Community Code",
    join: "Join",
    requestJoin: "Request to Join",
    member: "Member",
    communityName: "Community Name",
    communityDesc: "Description",
    createCommunityTitle: "Establish New Community",
    communityCode: "Community Code",
    members: "Members",
    manageMembers: "Manage Members",
    pendingRequests: "Pending Requests",
    accept: "Accept",
    kick: "Kick",
    deleteCommunity: "Delete Community",
    noCommunities: "You haven't joined any communities yet.",
    waitingApproval: "Waiting for General Admin approval.",
    generalAdminView: "Super Admin View",
    communityReview: "Community Review",
    clearChatHistory: "Clear Chat History",
    
    // Bounty
    bountyStatus: "Status",
    openBounties: "Open Tasks",
    closedBounties: "Closed",
    submitSolution: "Submit Solution",
    bountyTitle: "Task Title",
    bountyRewardPlaceholder: "e.g. $50 Credit, Featured Spot...",
    create: "Create",
    activeBounties: "Active Bounties",
    submittingFor: "Submitting solution for task:",
    bountySolution: "Bounty Solution",
    noActiveBounties: "No active bounties at the moment.",
    noDemosFound: "No demos found",
    tryAdjusting: "Try adjusting your filters or search query",
    sortByDate: "Sort by date",
    sortDate: "Latest",
    sortByLikes: "Sort by likes",
    sortLikes: "Popular",
    chatWelcome: "Welcome to Tomorrow! How can I assist your research today?",
    allDemos: "All Research Demos",
    quickUpload: "Quick Upload",
    editCover: "Edit Cover",
    updateCoverTitle: "Update Demo Cover",
    cancel: "Cancel",
    save: "Save",
    coverUpdated: "Cover image updated successfully.",
    delete: "Delete",
    by: "by",
    running: "Running",
    didYouKnow: "Did you know?",
    didYouKnowText: "This simulation runs in real-time. You can modify the parameters in the code tab to see how the physics changes!",
    suggestedQuestions: "Suggested Questions",
    analyzing: "Analyzing demo code...",
    explainMath: "Explain the math",
    changeColor: "How to change color?",
    makeFaster: "Make it faster",
    readOnly: "Read-only",
    aiError: "Sorry, an error occurred. Please try again later.",
    enterRejectionReason: "Enter rejection reason:",
    defaultRejectionReason: "Content does not meet guidelines",
    user: "User",
    noCategoriesYet: "No categories yet.",
    // Auth
    adminPortal: "Admin Portal",
    createAccount: "Create Account",
    restrictedAccess: "Restricted access for system administrators.",
    accessPlatform: "Access the scientific demonstration platform.",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    passwordsDoNotMatch: "Passwords do not match",
    fillAllFields: "Please fill in all fields",
    signIn: "Sign In",
    alreadyHaveAccount: "Already have an account? Sign In",
    needAccount: "Need an account? Register",
    adminRegistrationDisabled: "Admin registration is disabled",
    authFailed: "Authentication failed",
    userLogin: "User Login",
    // Upload Wizard
    uploadCodeFile: "Upload HTML File",
    selectHtmlFile: "Select an .html file containing your demo code.",
    selectFile: "Select File",
    selectCategory: "Select Category...",
    noCategoriesFound: "No categories found for this target. Please create one.",
    uploadFile: "Upload File",
    pasteCode: "Paste Code",
    pasteCodePlaceholder: "Paste your HTML/JS code here...",
    clear: "Clear",
    pleaseEnterCode: "Please enter your code",
    chars: "chars",
    thumbnail: "Thumbnail",
    thumbnailOptional: "Optional",
    uploadThumbnail: "Upload Thumbnail",
    thumbnailFormats: "JPG, PNG supported, optional",
    removeThumbnail: "Remove thumbnail",
    submitForReview: "Submit for review. Will be published after admin approval.",
    exit: "Exit",
    onlinePreview: "Online Preview",
    playgroundDesc: "Paste HTML code and preview instantly.",
    publiclyAvailable: "Publicly available to all researchers.",
    exclusiveToCommunity: "Exclusive to specific community members.",
    noCommunitiesJoin: "You haven't joined any communities. Please join a community first.",
    // Multi-file upload
    singleFile: "Single File",
    multiFile: "Multi-File (ZIP)",
    uploadZipFile: "Upload ZIP File",
    zipFileDesc: "Upload a ZIP file containing HTML, CSS, JS, and image files.",
    selectZipFile: "Select ZIP File",
    analyzingZip: "Analyzing ZIP file...",
    projectStructure: "Project Structure",
    emptyZip: "Empty ZIP file",
    project: "Project",
    multiFilePreviewDesc: "Multi-file projects will be previewed after upload.",
    projectDetails: "Project Details",
    fileName: "File Name",
    fileSize: "File Size",
    fileCount: "File Count",
    // Status
    published: "Published",
    myPublishedWorks: "My Published Works",
    generalLibrary: "General Library",
    noCommunity: "Temporarily not belonging to any community",
    publishedIn: "Published in:",
    myFeedbacks: "My Feedbacks/Complaints",
    archiveArea: "Archive Area",
    archivedDemosDesc: "These are your archived demos. You can restore or permanently delete them.",
    archived: "Archived",
    archivedAt: "Archived at",
    unknownTime: "Unknown time",
    view: "View",
    permanentDelete: "Permanent Delete",
    // Feedback
    demoComplaint: "Demo Complaint",
    communityFeedback: "Community Feedback",
    websiteFeedback: "Website Feedback",
    banAppeal: "Ban Appeal",
    feedbackType: "Feedback",
    statusPending: "Pending",
    statusInProgress: "In Progress",
    statusResolved: "Resolved",
    statusDismissed: "Dismissed",
    statusUpdated: "Status updated successfully!",
    updateFailed: "Update failed, please try again",
    confirmDeleteFeedback: "Are you sure you want to delete this feedback/complaint record? This action is irreversible!",
    deleteSuccess: "Deleted successfully!",
    deleteFailed: "Delete failed, please try again",
    noFeedbackRecords: "No feedback records yet",
    feedbackDetails: "Details",
    relatedDemo: "Related Demo",
    relatedCommunity: "Related Community",
    resolution: "Resolution",
    reviewedAt: "Reviewed at",
    deleteRecord: "Delete Record",
    updateStatus: "Update Status",
    startProcessing: "Start Processing",
    enterResolution: "Enter resolution (optional)...",
    markResolved: "Mark Resolved",
    dismiss: "Dismiss",
    feedbackManagement: "Feedback/Complaint Management",
    // DemoPlayer
    zoomOut: "Zoom Out",
    resetZoom: "Reset Zoom",
    zoomIn: "Zoom In",
    tapToShowControls: "Tap to show controls",
    publishToOther: "Publish to Other Platforms",
    editDemo: "Edit Demo",
    reportDemo: "Report Demo",
    aiConfiguredVersion: "AI Configured Version",
    modifiedCode: "Modified Code",
    originalCode: "Original Code",
    clearHistory: "Clear History",
    editDemoTitle: "Edit Demo",
    pleaseEnterTitle: "Please enter a title",
    updateSubmitted: "Update submitted! Waiting for admin approval.",
    title: "Title",
    description: "Description",
    uploadNewFile: "Upload new file (optional)",
    uploadOriginalFile: "Upload original file (optional)",
    selected: "Selected",
    basicInfo: "Basic Info",
    comments: "Comments",
    noComments: "No comments yet",
    writeComment: "Write a comment...",
    sendComment: "Send",
    deleteComment: "Delete",
    confirmDeleteComment: "Are you sure you want to delete this comment?",
    // Theme
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    // Levels & Points
    level: "Level",
    contributionPoints: "Contribution Points",
    points: "Points",
    levelLearner: "Learner",
    levelResearcher1: "Junior Researcher",
    levelResearcher2: "Senior Researcher",
    levelResearcher3: "Principal Researcher",
    levelCoCreator: "Co-Creator",
    nextLevel: "Next Level",
    // User Management
    userManagement: "User Management",
    pendingCommunities: "Pending Communities",
    // Profile Page
    bio: "Bio",
    notProvided: "Not provided",
    contactInfo: "Contact Info",
    communitiesManaged: "Communities Managed",
    worksPublished: "Works Published",
    supportMe: "Support Me",
    noPaymentQrCodeProvided: "No payment QR code provided",
    pointsNeeded: "Points Needed",
    privileges: "Privileges",
    favorites: "Favorites",
    noFavorites: "No favorites yet",
    contributorWall: "Contributor Wall",
    editContributionPoints: "Edit Contribution Points",
    // Additional translations
    personalCenter: "Personal Center",
    need10Points: "Requires 10 contribution points to unlock",
    announcements: "Announcements",
    submitWebsiteFeedback: "Submit Website Feedback",
    viewGuide: "View User Guide",
    guide: "Guide",
    clickToViewGuide: "Click to view the beginner's guide and quickly learn how to use this platform 🎉",
    announcementsCenter: "Announcements Center",
    viewAndManageAnnouncements: "View and manage platform announcements",
    announcementPublished: "Announcement published successfully!",
    confirmDeleteAnnouncement: "Delete this announcement?",
    latestAnnouncements: "Latest Announcements",
    noAnnouncements: "No announcements yet",
    backToProfile: "Back to Profile",
    banAppealMessage: "You can only access the personal center to view your works and submit an appeal for unban",
    requiresResearcher1: "Requires Researcher Level 1 or above",
    feedback: "Feedback",
    accountBanned: "Account Banned",
    banReason: "Ban Reason",
    submitAppeal: "Submit Appeal",
    exploreShop: "Explore Shop",
    unlockExclusiveCustomizations: "Unlock exclusive customizations with points",
    pointsAndContribution: "Points & Contribution",
    unlocked: "Unlocked",
    exclusiveFeatures: "Exclusive Features",
    confirmRestoreDemo: "Are you sure you want to restore this demo?",
    restoreFailed: "Restore failed",
    confirmPermanentlyDeleteDemo: "Are you sure you want to permanently delete this demo? This action cannot be undone!",
    permanentlyDeleteFailed: "Permanently delete failed",
    avatarBorder: "Avatar Border",
    exclusiveBadge: "Exclusive Badge",
    yourLevelBadgeWillBeHighlighted: "Your level badge will be highlighted when displaying demos",
    yourNameIsOnTheContributorWall: "Your name is on the contributor wall!",
    confirmRemoveFromFavorites: "Are you sure you want to remove this demo from favorites?",
    removeFromFavoritesFailed: "Remove from favorites failed",
    pointsAndContributionGuide: "Points & Contribution Guide",
    completelyNonProfit: "Completely non-profit",
    forLevelingUpAndUnlockingPrivileges: "For leveling up and unlocking privileges",
    uploadAnApprovedDemoProgram: "Upload an approved demo program",
    forRedeemingItemsInThePointsShop: "For redeeming items in the Points Shop",
    rewardTasks: "Reward tasks",
    platformIsCompletelyNonProfit: "💡 This platform is completely non-profit, all features are free to use",
    gotIt: "Got it",
    feedbackSubmittedSuccessfully: "Feedback submitted successfully!",
    submitFailedPleaseTryAgain: "Submit failed, please try again",
    demoBeingComplained: "Demo being complained about",
    communityBeingFeedbacked: "Community being feedbacked",
    detailedDescription: "Detailed Description",
    pleaseDescribeYourProblemOrSuggestion: "Please describe your problem or suggestion in detail...",
    submitting: "Submitting...",
    submitFeedback: "Submit Feedback",
    tags: "Tags",
    editTags: "Edit Tags",
    saveTags: "Save Tags",
    noTagsYet: "No tags yet",
    clickFullscreenToWatch: "Click 'Fullscreen' to watch in landscape mode",
    pleaseRotatePhone: "Please rotate phone",
    landscapeModeIsBetter: "Landscape mode is better",
    confirmClearChatHistory: "Are you sure you want to clear the chat history?",
    updateTagsFailed: "Failed to update tags",
    submittingUpdate: "Submitting...",
    submitUpdate: "Submit Update",
    // Profile Edit
    newPasswordOptional: "New Password (Optional)",
    contactInfoOptional: "Contact Info (Optional)",
    emailWeChatEtc: "Email, WeChat, etc.",
    bioOptional: "Bio (Optional)",
    tellUsAboutYourself: "Tell us about yourself...",
    paymentQrCodeOptional: "Payment QR Code (Optional)",
    clickToUploadPaymentQrCode: "Click to upload payment QR code"
  },
  cn: {
    appTitle: "Tomorrow",
    explore: "探索",
    bounties: "悬赏大厅",
    upload: "上传",
    admin: "管理",
    profile: "个人主页",
    searchPlaceholder: "搜索演示 (Cmd+K)...",

    // Auth & Roles
    loginTitle: "选择身份",
    loginSubtitle: "选择您的访问权限以进入实验室。",
    roleUser: "科研人员",
    roleUserDesc: "浏览演示，加入或创建科研社区。",
    roleGeneralAdmin: "总管理员",
    roleGeneralAdminDesc: "管理通用知识库，审核并监管所有社区。",
    welcomeBack: "欢迎回来，",
    logout: "退出登录",
    accessLevel: "访问级别",

    // Profile
    profileTitle: "研究员档案",
    accountType: "账户类型",
    memberSince: "注册时间",
    contributions: "贡献统计",
    createCommunity: "创建社区",
    myCommunities: "我的社区",
    communityStatus: "状态",

    subjects: "学科分类",
    all: "全部分类",
    open: "打开",
    details: "详情",
    code: "源代码",
    aiHelper: "AI 助手",
    concept: "科学原理",
    refresh: "刷新",
    fullscreen: "全屏",
    exitFullscreen: "退出全屏",
    close: "关闭",
    uploadTitle: "提交新演示",
    stepInfo: "基本信息",
    stepEditor: "代码编辑",
    stepPreview: "预览",
    titleLabel: "标题",
    authorLabel: "作者",
    descLabel: "描述",
    subjectLabel: "分类 / 学科",
    coverImage: "封面图片",
    uploadCover: "上传封面",
    next: "下一步",
    back: "返回",
    submit: "提交",
    pending: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
    adminDashboard: "治理中心",
    approve: "通过",
    reject: "拒绝",
    statsTotal: "演示总数",
    statsPending: "待审核",
    statsUsers: "活跃用户",
    emptyPending: "暂无待处理项。",
    aiChatTitle: "AI 实验室助手",
    aiChatPlaceholder: "询问科学知识或演示...",
    send: "发送",
    successMsg: "操作成功！",
    uploadSuccessMsg: "上传成功！您的演示已提交审核，管理员审核通过后将正式发布。",
    physics: "物理",
    chemistry: "化学",
    mathematics: "数学",
    biology: "生物",
    computerScience: "计算机科学",
    astronomy: "天文学",
    earthScience: "地球科学",
    creativeTools: "创意工具",
    // New translations
    layerGeneral: "通用知识库",
    layerCommunity: "社区中心",
    addCategory: "新建分类",
    addSubCategory: "添加子分类",
    deleteCategory: "删除",
    enterCategoryName: "输入分类名称:",
    communityRoot: "社区根目录",
    selectLayer: "选择区域",
    confirmDeleteCat: "确定删除此分类及其所有内容吗？",
    confirmDeleteBounty: "永久删除此悬赏任务？",
    confirmDeleteDemo: "删除此演示？",
    confirmDeleteDemoToArchive: "确定要删除这个程序吗？它将被移到留档区。",
    // Bounty
    bountyHall: "悬赏任务",
    bountyDesc: "探索并解决开放的科学挑战以获得奖励。",
    createBounty: "发布悬赏",
    reward: "奖励",
    // Community
    communityHall: "社区大厅",
    selectCommunity: "选择社区",
    joinByCode: "使用代码加入",
    enterCode: "输入12位社区代码",
    join: "加入",
    requestJoin: "申请加入",
    member: "成员",
    communityName: "社区名称",
    communityDesc: "社区描述",
    createCommunityTitle: "建立新社区",
    communityCode: "社区代码",
    members: "成员列表",
    manageMembers: "成员管理",
    pendingRequests: "待处理申请",
    accept: "接受",
    kick: "移除",
    deleteCommunity: "删除社区",
    noCommunities: "您尚未加入任何社区。",
    waitingApproval: "等待总管理员审核。",
    generalAdminView: "超级管理员视角",
    communityReview: "社区审核",
    clearChatHistory: "清除聊天历史",
    
    // Bounty
    bountyStatus: "状态",
    openBounties: "进行中",
    closedBounties: "已结束",
    submitSolution: "提交方案",
    bountyTitle: "任务标题",
    bountyRewardPlaceholder: "例如: 50积分, 首页推荐位...",
    create: "创建",
    activeBounties: "活跃任务",
    submittingFor: "正在提交解决方案：",
    bountySolution: "悬赏方案",
    noActiveBounties: "暂无活跃的悬赏任务。",
    noDemosFound: "未找到演示",
    tryAdjusting: "尝试调整筛选条件或搜索关键词",
    sortByDate: "按时间排序",
    sortDate: "最新",
    sortByLikes: "按点赞排序",
    sortLikes: "热门",
    chatWelcome: "Welcome to Tomorrow! How can I assist your research today？",
    allDemos: "全部研究演示",
    quickUpload: "快速上传",
    editCover: "修改封面",
    updateCoverTitle: "更新演示封面",
    cancel: "取消",
    save: "保存",
    coverUpdated: "封面图片已更新。",
    delete: "删除",
    by: "作者",
    running: "运行中",
    didYouKnow: "你知道吗？",
    didYouKnowText: "这是一个实时模拟。你可以在代码标签页修改参数，观察物理现象的变化！",
    suggestedQuestions: "建议提问",
    analyzing: "正在分析代码...",
    explainMath: "解释数学原理",
    changeColor: "如何改变颜色？",
    makeFaster: "让它变快点",
    readOnly: "只读",
    aiError: "抱歉，发生了错误。请稍后重试。",
    enterRejectionReason: "请输入驳回原因：",
    defaultRejectionReason: "内容不符合规范",
    user: "用户",
    noCategoriesYet: "暂无分类。",
    // Auth
    adminPortal: "管理员入口",
    createAccount: "创建账户",
    restrictedAccess: "系统管理员专用访问权限。",
    accessPlatform: "访问科学演示平台。",
    username: "用户名",
    password: "密码",
    confirmPassword: "确认密码",
    passwordsDoNotMatch: "密码不匹配",
    fillAllFields: "请填写所有字段",
    signIn: "登录",
    alreadyHaveAccount: "已有账户？登录",
    needAccount: "需要账户？注册",
    adminRegistrationDisabled: "管理员注册已禁用",
    authFailed: "认证失败",
    userLogin: "用户登录",
    // Upload Wizard
    uploadCodeFile: "上传 HTML 文件",
    selectHtmlFile: "选择一个包含演示代码的 .html 文件。",
    selectFile: "选择文件",
    selectCategory: "选择分类...",
    noCategoriesFound: "该目标没有可用分类，请先创建一个。",
    uploadFile: "上传文件",
    pasteCode: "粘贴代码",
    pasteCodePlaceholder: "在此粘贴您的 HTML/JS 代码...",
    clear: "清空",
    pleaseEnterCode: "请输入代码",
    chars: "字符",
    thumbnail: "预览图",
    thumbnailOptional: "可选",
    uploadThumbnail: "上传预览图",
    thumbnailFormats: "支持 JPG、PNG 格式，可选",
    removeThumbnail: "删除预览图",
    submitForReview: "提交审核。管理员审核通过后才会正式发布。",
    exit: "退出",
    onlinePreview: "在线预览",
    playgroundDesc: "粘贴 HTML 代码并即时预览。",
    publiclyAvailable: "对所有研究人员公开可用。",
    exclusiveToCommunity: "仅特定社区成员可用。",
    noCommunitiesJoin: "您还没有加入任何社区。请先加入一个社区。",
    // Multi-file upload
    singleFile: "单文件",
    multiFile: "多文件（ZIP）",
    uploadZipFile: "上传 ZIP 文件",
    zipFileDesc: "上传一个包含 HTML、CSS、JS 和图片文件的 ZIP 文件。",
    selectZipFile: "选择 ZIP 文件",
    analyzingZip: "正在分析 ZIP 文件...",
    projectStructure: "项目结构",
    emptyZip: "ZIP 文件为空",
    project: "项目",
    multiFilePreviewDesc: "多文件项目将在上传后进行预览。",
    projectDetails: "项目详情",
    fileName: "文件名",
    fileSize: "文件大小",
    fileCount: "文件数量",
    // Status
    published: "已发布",
    myPublishedWorks: "我的发布作品",
    generalLibrary: "通用知识库",
    noCommunity: "暂时不归属于任何社区",
    publishedIn: "发布于：",
    myFeedbacks: "我的反馈/投诉记录",
    archiveArea: "留档区域",
    archivedDemosDesc: "这些是你已留档的程序，你可以恢复或永久删除它们。",
    archived: "留档",
    archivedAt: "留档于",
    unknownTime: "未知时间",
    view: "查看",
    permanentDelete: "永久删除",
    // Feedback
    demoComplaint: "演示投诉",
    communityFeedback: "社区反馈",
    websiteFeedback: "网页建议",
    banAppeal: "解封申诉",
    feedbackType: "反馈",
    statusPending: "待处理",
    statusInProgress: "处理中",
    statusResolved: "已解决",
    statusDismissed: "已驳回",
    statusUpdated: "状态更新成功！",
    updateFailed: "更新失败，请重试",
    confirmDeleteFeedback: "确定要删除这条反馈/投诉记录吗？此操作不可撤销！",
    deleteSuccess: "删除成功！",
    deleteFailed: "删除失败，请重试",
    noFeedbackRecords: "暂无反馈记录",
    feedbackDetails: "详细内容",
    relatedDemo: "相关演示程序",
    relatedCommunity: "相关社区",
    resolution: "处理结果",
    reviewedAt: "处理时间：",
    deleteRecord: "删除记录",
    updateStatus: "更新状态",
    startProcessing: "开始处理",
    enterResolution: "输入处理结果（可选）...",
    markResolved: "标记已解决",
    dismiss: "驳回",
    feedbackManagement: "反馈/投诉处理",
    // DemoPlayer
    zoomOut: "缩小",
    resetZoom: "重置缩放",
    zoomIn: "放大",
    tapToShowControls: "点击显示控制",
    publishToOther: "发布到其他平台",
    editDemo: "修改程序",
    reportDemo: "投诉此演示",
    aiConfiguredVersion: "AI配置版本",
    modifiedCode: "修改后代码",
    originalCode: "原始代码",
    clearHistory: "清除历史",
    editDemoTitle: "修改程序",
    pleaseEnterTitle: "请输入标题",
    updateSubmitted: "更新提交成功！等待管理员审批。",
    title: "标题",
    description: "描述",
    uploadNewFile: "上传新的文件（可选）",
    uploadOriginalFile: "上传原始文件（可选）",
    selected: "已选择",
    basicInfo: "基础信息",
    comments: "评论",
    noComments: "暂无评论",
    writeComment: "写评论...",
    sendComment: "发送",
    deleteComment: "删除",
    confirmDeleteComment: "确定要删除这条评论吗？",
    // Theme
    lightMode: "亮色模式",
    darkMode: "暗色模式",
    // Levels & Points
    level: "等级",
    contributionPoints: "社区贡献值",
    points: "社区积分",
    levelLearner: "学习者",
    levelResearcher1: "一级研究员",
    levelResearcher2: "二级研究员",
    levelResearcher3: "三级研究员",
    levelCoCreator: "共创研究员",
    nextLevel: "下一等级",
    // User Management
    userManagement: "用户管理",
    pendingCommunities: "待审核社区",
    // Profile Page
    bio: "个人简介",
    notProvided: "未提供",
    contactInfo: "联系信息",
    communitiesManaged: "管理的社区",
    worksPublished: "发布的作品",
    supportMe: "支持我",
    noPaymentQrCodeProvided: "未提供支付二维码",
    pointsNeeded: "还需积分",
    privileges: "已解锁特权",
    favorites: "收藏夹",
    noFavorites: "暂无收藏",
    contributorWall: "贡献者墙",
    editContributionPoints: "修改贡献值",
    // Additional translations
    personalCenter: "个人中心",
    need10Points: "需要10贡献值解锁",
    announcements: "公告",
    submitWebsiteFeedback: "提交网站反馈",
    viewGuide: "查看使用指南",
    guide: "指南",
    clickToViewGuide: "点击查看新手指南，快速了解如何使用本平台 🎉",
    announcementsCenter: "公告中心",
    viewAndManageAnnouncements: "查看和管理平台公告",
    announcementPublished: "公告发布成功！",
    confirmDeleteAnnouncement: "确定删除这个公告吗？",
    latestAnnouncements: "最新公告",
    noAnnouncements: "暂无公告",
    backToProfile: "返回个人中心",
    banAppealMessage: "您只能访问个人中心查看您的作品，并提交解封申诉",
    requiresResearcher1: "需要一级研究员及以上等级",
    feedback: "反馈",
    accountBanned: "账号已封禁",
    banReason: "封禁原因",
    submitAppeal: "提交申诉",
    exploreShop: "探索商城",
    unlockExclusiveCustomizations: "用积分解锁专属定制",
    pointsAndContribution: "积分与贡献值",
    unlocked: "已解锁",
    exclusiveFeatures: "专属功能",
    confirmRestoreDemo: "确定要恢复这个程序吗？",
    restoreFailed: "恢复失败",
    confirmPermanentlyDeleteDemo: "确定要永久删除这个程序吗？此操作不可撤销！",
    permanentlyDeleteFailed: "永久删除失败",
    avatarBorder: "头像边框",
    exclusiveBadge: "专属徽章",
    yourLevelBadgeWillBeHighlighted: "您的等级徽章将在展示程序时突出显示",
    yourNameIsOnTheContributorWall: "您的名字已登上贡献者墙！",
    confirmRemoveFromFavorites: "确定要从收藏夹中移除这个演示吗？",
    removeFromFavoritesFailed: "移除收藏失败",
    pointsAndContributionGuide: "积分与贡献值说明",
    completelyNonProfit: "完全非盈利",
    forLevelingUpAndUnlockingPrivileges: "用于提升等级，解锁特权",
    uploadAnApprovedDemoProgram: "上传审核通过的演示程序",
    forRedeemingItemsInThePointsShop: "用于在积分商城兑换商品",
    rewardTasks: "悬赏任务",
    platformIsCompletelyNonProfit: "💡 本平台完全非盈利，所有功能均为免费使用",
    gotIt: "我知道了",
    feedbackSubmittedSuccessfully: "反馈提交成功！",
    submitFailedPleaseTryAgain: "提交失败，请重试",
    demoBeingComplained: "投诉的演示程序",
    communityBeingFeedbacked: "反馈的社区",
    detailedDescription: "详细描述",
    pleaseDescribeYourProblemOrSuggestion: "请详细描述您的问题或建议...",
    submitting: "提交中...",
    submitFeedback: "提交反馈",
    tags: "标签",
    editTags: "编辑标签",
    saveTags: "保存标签",
    noTagsYet: "暂无标签",
    clickFullscreenToWatch: "点击底部「全屏」横屏观看",
    pleaseRotatePhone: "请旋转手机",
    landscapeModeIsBetter: "横屏观看体验更佳",
    confirmClearChatHistory: "确定要清除聊天历史吗？",
    updateTagsFailed: "更新标签失败",
    submittingUpdate: "提交中...",
    submitUpdate: "提交更新",
    // Profile Edit
    newPasswordOptional: "新密码 (可选)",
    contactInfoOptional: "联系信息 (可选)",
    emailWeChatEtc: "邮箱、微信等",
    bioOptional: "个人简介 (可选)",
    tellUsAboutYourself: "告诉我们关于你自己...",
    paymentQrCodeOptional: "付款二维码 (可选)",
    clickToUploadPaymentQrCode: "点击上传付款二维码"
  }
};

export const SEED_DEMOS: Demo[] = [
  {
    id: 'seed-1',
    title: 'Elastic Collision Simulation',
    categoryId: Subject.Physics,
    layer: 'general',
    author: 'Dr. Newton',
    description: 'A real-time canvas simulation of perfectly elastic collisions between particles.',
    status: 'published',
    createdAt: Date.now(),
    code: `<!DOCTYPE html>
<html>
<body style="margin:0; overflow:hidden; background:#0f172a;">
<canvas id="c"></canvas>
<script>
const c = document.getElementById('c');
const ctx = c.getContext('2d');
c.width = window.innerWidth;
c.height = window.innerHeight;

class Ball {
  constructor(x, y, r, dx, dy, color) {
    this.x = x; this.y = y; this.r = r;
    this.dx = dx; this.dy = dy; this.color = color;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
  update() {
    if (this.x + this.r > c.width || this.x - this.r < 0) this.dx = -this.dx;
    if (this.y + this.r > c.height || this.y - this.r < 0) this.dy = -this.dy;
    this.x += this.dx;
    this.y += this.dy;
    this.draw();
  }
}

const balls = [];
for(let i=0; i<20; i++) {
  const r = 15;
  const x = Math.random() * (c.width - r*2) + r;
  const y = Math.random() * (c.height - r*2) + r;
  const dx = (Math.random() - 0.5) * 8;
  const dy = (Math.random() - 0.5) * 8;
  balls.push(new Ball(x, y, r, dx, dy, \`hsl(\${Math.random()*360}, 70%, 60%)\`));
}

function animate() {
  requestAnimationFrame(animate);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.fillRect(0, 0, c.width, c.height);
  balls.forEach(b => b.update());
}
animate();
</script>
</body>
</html>`
  },
  {
    id: 'seed-2',
    title: 'Fibonacci Spiral',
    categoryId: Subject.Mathematics,
    layer: 'general',
    author: 'Fibonacci Fan',
    description: 'Visualizing the Golden Ratio through a recursive spiral pattern.',
    status: 'published',
    createdAt: Date.now() - 100000,
    code: `<!DOCTYPE html>
<html>
<body style="margin:0; overflow:hidden; display:flex; justify-content:center; align-items:center; height:100vh; background:#fff;">
<canvas id="canvas"></canvas>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const cx = canvas.width / 2;
const cy = canvas.height / 2;
let angle = 0;

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  
  const scale = 5;
  for(let i=0; i<300; i++) {
    const r = scale * Math.sqrt(i);
    const theta = i * 2.39996; // Golden angle approx
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI*2);
    ctx.fillStyle = \`hsl(\${i + angle*50}, 80%, 50%)\`;
    ctx.fill();
  }
  ctx.restore();
  angle += 0.005;
  requestAnimationFrame(draw);
}
draw();
</script>
</body>
</html>`
  },
  {
    id: 'seed-3',
    title: 'Molecular Bond Vibration',
    categoryId: Subject.Chemistry,
    layer: 'general',
    author: 'Curie Lab',
    description: 'Simulated atomic bonds vibrating using a spring physics model.',
    status: 'published',
    createdAt: Date.now() - 200000,
    code: `<!DOCTYPE html>
<html>
<body style="margin:0; overflow:hidden; background:#f0f9ff;">
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const atom1 = {x: canvas.width/2 - 100, y: canvas.height/2, vx: 0, vy: 0, r: 30, color: '#ef4444'};
const atom2 = {x: canvas.width/2 + 100, y: canvas.height/2, vx: 0, vy: 0, r: 30, color: '#3b82f6'};
const k = 0.05; // spring constant
const restLength = 200;
const damping = 0.95;

function update() {
  const dx = atom2.x - atom1.x;
  const dy = atom2.y - atom1.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const force = (dist - restLength) * k;
  
  const fx = (dx / dist) * force;
  const fy = (dy / dist) * force;
  
  atom1.vx += fx; atom1.vy += fy;
  atom2.vx -= fx; atom2.vy -= fy;
  
  atom1.x += atom1.vx; atom1.y += atom1.vy;
  atom2.x += atom2.vx; atom2.y += atom2.vy;
  
  atom1.vx *= damping; atom1.vy *= damping;
  atom2.vx *= damping; atom2.vy *= damping;
  
  // Random thermal noise
  atom1.vx += (Math.random()-0.5);
  atom2.vx += (Math.random()-0.5);

  ctx.clearRect(0,0,canvas.width, canvas.height);
  
  // Bond
  ctx.beginPath();
  ctx.moveTo(atom1.x, atom1.y);
  ctx.lineTo(atom2.x, atom2.y);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#94a3b8';
  ctx.stroke();
  
  // Atoms
  [atom1, atom2].forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
    ctx.fillStyle = a.color;
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = a.color;
  });
  
  requestAnimationFrame(update);
}
update();
</script>
</body>
</html>`
  }
];

export const getTranslation = (lang: Language, key: keyof typeof DICTIONARY['en']) => {
  return DICTIONARY[lang][key] || key;
};

// Level Configuration
export const LEVEL_CONFIG = {
  learner: { min: 0, max: 9, name: { en: 'Learner', cn: '学习者' }, color: '#94a3b8', iconKey: 'book-open' },
  researcher1: { min: 10, max: 99, name: { en: 'Junior Researcher', cn: '一级研究员' }, color: '#3b82f6', iconKey: 'flask-conical' },
  researcher2: { min: 100, max: 199, name: { en: 'Senior Researcher', cn: '二级研究员' }, color: '#10b981', iconKey: 'beaker' },
  researcher3: { min: 200, max: 299, name: { en: 'Principal Researcher', cn: '三级研究员' }, color: '#8b5cf6', iconKey: 'award' },
  co_creator: { min: 300, max: Infinity, name: { en: 'Co-Creator', cn: '共创研究员' }, color: '#f59e0b', iconKey: 'trophy' }
};

// Privileges for each level
export const LEVEL_PRIVILEGES = {
  learner: {
    cn: ['浏览演示', '评论', '收藏演示'],
    en: ['Browse demos', 'Comment', 'Favorite demos'],
    bonusPoints: 0,
    requiresApproval: true
  },
  researcher1: {
    cn: ['建立社区', '专属头像边框', '程序点赞功能'],
    en: ['Create communities', 'Exclusive avatar border', 'Like demos'],
    bonusPoints: 0,
    requiresApproval: true
  },
  researcher2: {
    cn: ['每次发布程序额外获得10积分'],
    en: ['+10 bonus points per published demo'],
    bonusPoints: 10,
    requiresApproval: true
  },
  researcher3: {
    cn: ['每次发布程序额外获得20积分', '建立社区（免审核）', '专属徽章展示'],
    en: ['+20 bonus points per published demo', 'Create communities (no approval needed)', 'Exclusive badge display'],
    bonusPoints: 20,
    requiresApproval: false
  },
  co_creator: {
    cn: ['名字出现在贡献者墙', '每次发布程序额外获得40积分'],
    en: ['Name on Contributor Wall', '+40 bonus points per published demo'],
    bonusPoints: 40,
    requiresApproval: false
  }
};

// Get bonus points for publishing a demo
export const getBonusPointsForPublishing = (contributionPoints: number, isAdmin?: boolean): number => {
  const level = calculateLevel(contributionPoints, isAdmin);
  return LEVEL_PRIVILEGES[level].bonusPoints;
};

// Check if user can create community without approval
export const canCreateCommunityWithoutApproval = (contributionPoints: number, isAdmin?: boolean): boolean => {
  const level = calculateLevel(contributionPoints, isAdmin);
  return !LEVEL_PRIVILEGES[level].requiresApproval;
};

// Check if user is on contributor wall
export const isOnContributorWall = (contributionPoints: number, isAdmin?: boolean): boolean => {
  const level = calculateLevel(contributionPoints, isAdmin);
  return level === 'co_creator' || !!isAdmin;
};

// Check if user has exclusive badge display
export const hasExclusiveBadgeDisplay = (contributionPoints: number, isAdmin?: boolean): boolean => {
  const level = calculateLevel(contributionPoints, isAdmin);
  return ['researcher3', 'co_creator'].includes(level) || !!isAdmin;
};

// Check if user has exclusive avatar border access
export const hasExclusiveAvatarBorder = (contributionPoints: number, isAdmin?: boolean): boolean => {
  const level = calculateLevel(contributionPoints, isAdmin);
  return level !== 'learner' || !!isAdmin;
};

// Calculate level from contribution points
export const calculateLevel = (points: number, isAdmin?: boolean): keyof typeof LEVEL_CONFIG => {
  if (isAdmin) return 'co_creator';
  if (points >= 300) return 'co_creator';
  if (points >= 200) return 'researcher3';
  if (points >= 100) return 'researcher2';
  if (points >= 10) return 'researcher1';
  return 'learner';
};

// Check if level is at least target level
const LEVEL_ORDER = ['learner', 'researcher1', 'researcher2', 'researcher3', 'co_creator'] as const;
export const isLevelAtLeast = (currentLevel: keyof typeof LEVEL_CONFIG, targetLevel: keyof typeof LEVEL_CONFIG): boolean => {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
  const targetIndex = LEVEL_ORDER.indexOf(targetLevel);
  return currentIndex >= targetIndex;
};

// Get level info
export const getLevelInfo = (level: keyof typeof LEVEL_CONFIG, lang: Language) => {
  const config = LEVEL_CONFIG[level];
  return {
    ...config,
    displayName: lang === 'en' ? config.name.en : config.name.cn
  };
};

// Get points needed for next level
export const getPointsToNextLevel = (currentPoints: number) => {
  const level = calculateLevel(currentPoints);
  const config = LEVEL_CONFIG[level];
  if (config.max === Infinity) return 0;
  return Math.max(0, config.max - currentPoints + 1);
};

// ============== Shop Items ==============

// Avatar Borders - Premium Quality
export const AVATAR_BORDERS = [
  { id: 'border-platinum', name: '铂金边框', category: '奢华系列', color: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #cbd5e1 100%)', price: 5 },
  { id: 'border-gold', name: '黄金边框', category: '奢华系列', color: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', price: 5 },
  { id: 'border-rose-gold', name: '玫瑰金边框', category: '奢华系列', color: 'linear-gradient(135deg, #fce7f3 0%, #f472b6 50%, #db2777 100%)', price: 5 },
  { id: 'border-cyber-blue', name: '赛博蓝', category: '科技系列', color: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #0284c7 100%)', price: 5 },
  { id: 'border-neon-pink', name: '霓虹粉', category: '科技系列', color: 'linear-gradient(135deg, #f0abfc 0%, #e879f9 50%, #c026d3 100%)', price: 5 },
  { id: 'border-matrix-green', name: '矩阵绿', category: '科技系列', color: 'linear-gradient(135deg, #86efac 0%, #22c55e 50%, #15803d 100%)', price: 5 },
  { id: 'border-aurora', name: '极光幻彩', category: '限定系列', color: 'linear-gradient(135deg, #06b6d4 0%, #10b981 30%, #f59e0b 60%, #f43f5e 100%)', price: 5 },
  { id: 'border-forest-elite', name: '森林精英', category: '自然系列', color: 'linear-gradient(135deg, #86efac 0%, #10b981 50%, #065f46 100%)', price: 5 },
  { id: 'border-ocean-deep', name: '深海之蓝', category: '自然系列', color: 'linear-gradient(135deg, #67e8f9 0%, #0ea5e9 50%, #0369a1 100%)', price: 5 },
  { id: 'border-sunset-royal', name: '皇家日落', category: '自然系列', color: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #c2410c 100%)', price: 5 },
  { id: 'border-chinese-red', name: '中国红', category: '节日限定', color: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 50%, #991b1b 100%)', price: 5 },
  { id: 'border-christmas-elegant', name: '优雅圣诞', category: '节日限定', color: 'linear-gradient(135deg, #86efac 0%, #16a34a 50%, #14532d 100%)', price: 5 },
  { id: 'border-halloween-spooky', name: '幽灵万圣', category: '节日限定', color: 'linear-gradient(135deg, #fde047 0%, #f97316 50%, #7c2d12 100%)', price: 5 },
];

// Avatar Accessories - Premium Quality
export const AVATAR_ACCESSORIES = [
  { id: 'accessory-nobel-crown', name: '诺贝尔皇冠', category: '成就至尊', price: 15, icon: 'crown', color: '#fbbf24', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)' },
  { id: 'accessory-physics-laureate', name: '物理桂冠', category: '科研精英', price: 8, icon: 'atom', color: '#3b82f6', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' },
  { id: 'accessory-chemistry-flask', name: '化学烧瓶', category: '科研精英', price: 8, icon: 'flask', color: '#10b981', bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' },
  { id: 'accessory-math-compass', name: '数学圆规', category: '科研精英', price: 8, icon: 'compass', color: '#8b5cf6', bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' },
  { id: 'accessory-angel-wings', name: '天使翅膀', category: '梦幻系列', price: 10, icon: 'sparkles', color: '#f0abfc', bg: 'linear-gradient(135deg, #fdf4ff, #fae8ff)' },
  { id: 'accessory-devil-horns', name: '恶魔犄角', category: '梦幻系列', price: 10, icon: 'flame', color: '#ef4444', bg: 'linear-gradient(135deg, #fee2e2, #fecaca)' },
  { id: 'accessory-unicorn-horn', name: '独角兽角', category: '可爱梦幻', price: 9, icon: 'wand2', color: '#f472b6', bg: 'linear-gradient(135deg, #fdf2f8, #fce7f3)' },
  { id: 'accessory-kitty-ears', name: '猫咪耳朵', category: '可爱系列', price: 5, icon: 'cat', color: '#f97316', bg: 'linear-gradient(135deg, #ffedd5, #fed7aa)' },
  { id: 'accessory-bunny-fluffy', name: ' fluffy 兔子', category: '可爱系列', price: 5, icon: 'rabbit', color: '#ec4899', bg: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' },
  { id: 'accessory-star-halo', name: '星星光环', category: '可爱系列', price: 6, icon: 'star', color: '#fbbf24', bg: 'linear-gradient(135deg, #fef9c3, #fef08a)' },
  { id: 'accessory-emperor-crown', name: '帝王冠', category: '皇家系列', price: 20, icon: 'crown', color: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7, #fcd34d)' },
  { id: 'accessory-golden-trophy', name: '金奖杯', category: '皇家系列', price: 12, icon: 'trophy', color: '#eab308', bg: 'linear-gradient(135deg, #fefce8, #fef08a)' },
  { id: 'accessory-diamond-medal', name: '钻石勋章', category: '皇家系列', price: 18, icon: 'gem', color: '#06b6d4', bg: 'linear-gradient(135deg, #ecfeff, #a5f3fc)' },
  { id: 'accessory-santa-hat-premium', name: '高级圣诞帽', category: '节日限定', price: 8, icon: 'gift', color: '#ef4444', bg: 'linear-gradient(135deg, #fee2e2, #fca5a5)' },
  { id: 'accessory-pumpkin-lantern', name: '南瓜灯笼', category: '节日限定', price: 7, icon: 'pumpkin', color: '#f97316', bg: 'linear-gradient(135deg, #ffedd5, #fed7aa)' },
  { id: 'accessory-lantern-festival', name: '元宵灯笼', category: '节日限定', price: 8, icon: 'lightbulb', color: '#dc2626', bg: 'linear-gradient(135deg, #fee2e2, #fca5a5)' },
];

// Avatar Effects - Premium Quality
export const AVATAR_EFFECTS = [
  { id: 'effect-cosmic-glow', name: '宇宙辉光', category: '特效系列', price: 15, color: '#a78bfa', animation: 'glow', bg: 'linear-gradient(135deg, #0f172a, #1e293b)' },
  { id: 'effect-electric-pulse', name: '电子脉冲', category: '特效系列', price: 12, color: '#06b6d4', animation: 'pulse', bg: 'linear-gradient(135deg, #0f172a, #020617)' },
  { id: 'effect-magic-aura', name: '魔法光环', category: '特效系列', price: 13, color: '#f472b6', animation: 'aura', bg: 'linear-gradient(135deg, #1e1b4b, #312e81)' },
  { id: 'effect-fire-dance', name: '火焰舞动', category: '动态特效', price: 16, color: '#f97316', animation: 'fire', bg: 'linear-gradient(135deg, #7c2d12, #9a3412)' },
  { id: 'effect-water-flow', name: '水流涟漪', category: '动态特效', price: 16, color: '#0ea5e9', animation: 'water', bg: 'linear-gradient(135deg, #0c4a6e, #075985)' },
  { id: 'effect-wind-swirle', name: '风之漩涡', category: '动态特效', price: 16, color: '#a3e635', animation: 'wind', bg: 'linear-gradient(135deg, #14532d, #166534)' },
  { id: 'effect-aurora-borealis', name: '北极光', category: '限定特效', price: 25, color: '#10b981', animation: 'aurora', bg: 'linear-gradient(135deg, #020617, #0f172a, #1e3a8a)' },
  { id: 'effect-supernova', name: '超新星爆发', category: '限定特效', price: 30, color: '#fbbf24', animation: 'supernova', bg: 'linear-gradient(135deg, #0f172a, #7c2d12, #dc2626)' },
  { id: 'effect-quantum-flux', name: '量子涨落', category: '科技特效', price: 20, color: '#22d3ee', animation: 'quantum', bg: 'linear-gradient(135deg, #020617, #0f172a, #1e1b4b)' },
  { id: 'effect-neon-flash', name: '霓虹闪烁', category: '科技特效', price: 14, color: '#f0abfc', animation: 'flash', bg: 'linear-gradient(135deg, #0f172a, #1e1b4b, #4c1d95)' },
];

// Profile Themes - Premium Quality (负责底色)
export const PROFILE_THEMES = [
  { id: 'theme-elegant-black', name: '深邃黑', price: 10, colors: { primary: '#0f172a', secondary: '#1e293b', background: '#0f172a' } },
  { id: 'theme-elegant-white', name: '纯净白', price: 10, colors: { primary: '#f8fafc', secondary: '#f1f5f9', background: '#f8fafc' } },
  { id: 'theme-elegant-navy', name: '海军蓝', price: 11, colors: { primary: '#0f172a', secondary: '#1e3a8a', background: '#0f172a' } },
  { id: 'theme-elegant-burgundy', name: '酒红色', price: 11, colors: { primary: '#450a0a', secondary: '#7f1d1d', background: '#450a0a' } },
  { id: 'theme-elegant-emerald', name: '祖母绿', price: 11, colors: { primary: '#064e3b', secondary: '#065f46', background: '#064e3b' } },
  { id: 'theme-elegant-cream', name: '奶油色', price: 10, colors: { primary: '#fefce8', secondary: '#fef9c3', background: '#fefce8' } },
  { id: 'theme-elegant-slate', name: '石板灰', price: 10, colors: { primary: '#1e293b', secondary: '#334155', background: '#1e293b' } },
  { id: 'theme-elegant-amber', name: '琥珀色', price: 12, colors: { primary: '#451a03', secondary: '#78350f', background: '#451a03' } },
];

// Profile Backgrounds - Premium Quality (负责典雅高级花纹，设计感几何纹路)
export const PROFILE_BACKGROUNDS = [
  { 
    id: 'bg-mosaic-diamond', 
    name: '钻石马赛克', 
    price: 12, 
    pattern: 'mosaic-diamond',
    colors: {
      accent1: '#a78bfa',
      accent2: '#8b5cf6',
      accent3: '#7c3aed'
    }
  },
  { 
    id: 'bg-herringbone', 
    name: '鱼骨纹', 
    price: 13, 
    pattern: 'herringbone',
    colors: {
      accent1: '#94a3b8',
      accent2: '#64748b',
      accent3: '#475569'
    }
  },
  { 
    id: 'bg-geometric-greek', 
    name: '希腊回纹', 
    price: 14, 
    pattern: 'greek',
    colors: {
      accent1: '#d4af37',
      accent2: '#b8860b',
      accent3: '#8b7355'
    }
  },
  { 
    id: 'bg-modern-grid', 
    name: '现代网格', 
    price: 11, 
    pattern: 'modern-grid',
    colors: {
      accent1: '#60a5fa',
      accent2: '#3b82f6',
      accent3: '#2563eb'
    }
  },
  { 
    id: 'bg-sacred-geometry', 
    name: '神圣几何', 
    price: 16, 
    pattern: 'sacred',
    colors: {
      accent1: '#fbbf24',
      accent2: '#f59e0b',
      accent3: '#d97706'
    }
  },
  { 
    id: 'bg-art-deco-fan', 
    name: '装饰艺术扇形', 
    price: 15, 
    pattern: 'art-deco-fan',
    colors: {
      accent1: '#e879f9',
      accent2: '#c026d3',
      accent3: '#9333ea'
    }
  },
  { 
    id: 'bg-hexagonal-hive', 
    name: '六边形蜂巢', 
    price: 13, 
    pattern: 'hexagonal',
    colors: {
      accent1: '#34d399',
      accent2: '#10b981',
      accent3: '#059669'
    }
  },
  { 
    id: 'bg-moroccan-tile', 
    name: '摩洛哥瓷砖', 
    price: 17, 
    pattern: 'moroccan',
    colors: {
      accent1: '#06b6d4',
      accent2: '#0891b2',
      accent3: '#0e7490'
    }
  },
  { 
    id: 'bg-checkerboard-soft', 
    name: '柔和棋盘格', 
    price: 10, 
    pattern: 'checkerboard',
    colors: {
      accent1: '#f87171',
      accent2: '#ef4444',
      accent3: '#dc2626'
    }
  },
  { 
    id: 'bg-solar-system', 
    name: '太阳系', 
    price: 18, 
    pattern: 'solar',
    colors: {
      accent1: '#fde68a',
      accent2: '#fcd34d',
      accent3: '#f59e0b'
    }
  },
];

// Username Colors - Premium Quality
export const USERNAME_COLORS = [
  { id: 'color-gold-elegant', name: '典雅金', category: '奢华系列', color: '#B8860B', price: 10 },
  { id: 'color-purple-deep', name: '深邃紫', category: '奢华系列', color: '#6B46C1', price: 10 },
  { id: 'color-blue-navy', name: '海军蓝', category: '奢华系列', color: '#1E40AF', price: 10 },
  { id: 'color-rose-classic', name: '古典玫瑰', category: '珍稀系列', color: '#BE123C', price: 15 },
  { id: 'color-teal-sage', name: '鼠尾草绿', category: '珍稀系列', color: '#0D9488', price: 15 },
  { id: 'color-emerald-rich', name: '浓郁翠', category: '珍稀系列', color: '#059669', price: 15 },
  { id: 'color-slate-cool', name: '清冷灰', category: '限定系列', color: '#475569', price: 18 },
  { id: 'color-amber-warm', name: '温润琥珀', category: '限定系列', color: '#D97706', price: 20 },
  { id: 'color-indigo-noble', name: '贵族靛蓝', category: '限定系列', color: '#4F46E5', price: 22 },
  { id: 'color-cyan-calm', name: '宁静青', category: '科技系列', color: '#0891B2', price: 12 },
  { id: 'color-red-crimson', name: '绯红', category: '特效系列', color: '#DC2626', price: 14 },
  { id: 'color-violet-mysterious', name: '神秘紫', category: '特效系列', color: '#7C3AED', price: 14 },
];

// Username Effects - Premium Quality
export const USERNAME_EFFECTS = [
  { id: 'ueffect-sparkle-trail', name: '星光轨迹', price: 15, color: '#fbbf24', animation: 'sparkle', bg: 'linear-gradient(135deg, #1f2937, #374151)' },
  { id: 'ueffect-neon-pulse', name: '霓虹脉冲', price: 14, color: '#f0abfc', animation: 'neon', bg: 'linear-gradient(135deg, #1f2937, #4c1d95)' },
  { id: 'ueffect-fire-flame', name: '火焰燃烧', price: 18, color: '#f97316', animation: 'fire', bg: 'linear-gradient(135deg, #7c2d12, #9a3412)' },
  { id: 'ueffect-water-ripple', name: '水波涟漪', price: 18, color: '#0ea5e9', animation: 'water', bg: 'linear-gradient(135deg, #0c4a6e, #075985)' },
  { id: 'ueffect-lightning', name: '闪电闪烁', price: 16, color: '#facc15', animation: 'lightning', bg: 'linear-gradient(135deg, #1f2937, #374151)' },
  { id: 'ueffect-glitter', name: '璀璨闪光', price: 15, color: '#ec4899', animation: 'glitter', bg: 'linear-gradient(135deg, #fdf2f8, #fce7f3)' },
  { id: 'ueffect-quantum-glitch', name: '量子故障', price: 20, color: '#22d3ee', animation: 'glitch', bg: 'linear-gradient(135deg, #020617, #1f2937)' },
  { id: 'ueffect-aurora-wave', name: '极光波动', price: 22, color: '#10b981', animation: 'aurora', bg: 'linear-gradient(135deg, #0f172a, #1e3a8a, #065f46)' },
];

// Custom Titles - Premium Quality
export const CUSTOM_TITLES = [
  { id: 'title-nobel-laureate', name: '诺贝尔奖得主', category: '至尊系列', price: 30 },
  { id: 'title-genius-scientist', name: '天才科学家', category: '科研精英', price: 15 },
  { id: 'title-physics-master', name: '物理学大师', category: '科研精英', price: 12 },
  { id: 'title-chemistry-wizard', name: '化学巫师', category: '科研精英', price: 12 },
  { id: 'title-math-genius', name: '数学天才', category: '科研精英', price: 12 },
  { id: 'title-code-ninja', name: '代码忍者', category: '创意系列', price: 10 },
  { id: 'title-digital-artist', name: '数字艺术家', category: '创意系列', price: 10 },
  { id: 'title-imagineer', name: '梦想工程师', category: '创意系列', price: 10 },
  { id: 'title-cosmic-explorer', name: '宇宙探索者', category: '探险系列', price: 13 },
  { id: 'title-time-traveler', name: '时空旅行者', category: '探险系列', price: 13 },
  { id: 'title-dragon-slayer', name: '屠龙勇士', category: '奇幻系列', price: 11 },
  { id: 'title-phoenix-rider', name: '凤凰骑士', category: '奇幻系列', price: 11 },
];

// Profile Effects - Premium Quality (个人主页特效)
export const PROFILE_EFFECTS = [
  { 
    id: 'effect-star-twinkle', 
    name: '星光闪烁', 
    category: '梦幻系列', 
    price: 15, 
    animation: 'star-twinkle',
    color: '#fbbf24'
  },
  { 
    id: 'effect-floating-particles', 
    name: '粒子悬浮', 
    category: '科技系列', 
    price: 18, 
    animation: 'floating-particles',
    color: '#6366f1'
  },
  { 
    id: 'effect-aurora-wave', 
    name: '极光波动', 
    category: '梦幻系列', 
    price: 22, 
    animation: 'aurora-wave',
    color: '#10b981'
  },
  { 
    id: 'effect-glow-pulse', 
    name: '光晕脉动', 
    category: '经典系列', 
    price: 12, 
    animation: 'glow-pulse',
    color: '#8b5cf6'
  },
  { 
    id: 'effect-rain-shimmer', 
    name: '雨丝微光', 
    category: '梦幻系列', 
    price: 16, 
    animation: 'rain-shimmer',
    color: '#38bdf8'
  },
  { 
    id: 'effect-firefly-dance', 
    name: '萤火飞舞', 
    category: '自然系列', 
    price: 17, 
    animation: 'firefly-dance',
    color: '#facc15'
  },
  { 
    id: 'effect-nebula-swirl', 
    name: '星云漩涡', 
    category: '宇宙系列', 
    price: 25, 
    animation: 'nebula-swirl',
    color: '#ec4899'
  },
  { 
    id: 'effect-gradient-flow', 
    name: '渐变流动', 
    category: '现代系列', 
    price: 14, 
    animation: 'gradient-flow',
    color: '#06b6d4'
  },
];

// App Themes - Premium Quality (有质感的配色方案)
export const APP_THEMES = [
  { 
    id: 'app-theme-light', 
    name: '明亮', 
    category: '基础系列', 
    price: 0, 
    colors: { 
      bg: '#f8fafc', 
      card: '#ffffff', 
      text: '#1e293b',
      border: '#e2e8f0',
      accent: '#6366f1'
    } 
  },
  { 
    id: 'app-theme-dark', 
    name: '深邃', 
    category: '基础系列', 
    price: 0, 
    colors: { 
      bg: '#0f172a', 
      card: '#1e293b', 
      text: '#f1f5f9',
      border: '#334155',
      accent: '#818cf8'
    } 
  },
  { 
    id: 'app-theme-slate', 
    name: '石板灰', 
    category: '经典系列', 
    price: 15, 
    colors: { 
      bg: '#1e293b', 
      card: '#334155', 
      text: '#f8fafc',
      border: '#475569',
      accent: '#94a3b8'
    } 
  },
  { 
    id: 'app-theme-ocean', 
    name: '海洋蓝', 
    category: '经典系列', 
    price: 15, 
    colors: { 
      bg: '#0c4a6e', 
      card: '#075985', 
      text: '#f0f9ff',
      border: '#0369a1',
      accent: '#38bdf8'
    } 
  },
  { 
    id: 'app-theme-forest', 
    name: '森林绿', 
    category: '经典系列', 
    price: 15, 
    colors: { 
      bg: '#064e3b', 
      card: '#065f46', 
      text: '#f0fdf4',
      border: '#047857',
      accent: '#34d399'
    } 
  },
  { 
    id: 'app-theme-warm', 
    name: '暖棕', 
    category: '经典系列', 
    price: 15, 
    colors: { 
      bg: '#1c1917', 
      card: '#292524', 
      text: '#fefce8',
      border: '#44403c',
      accent: '#fbbf24'
    } 
  },
  { 
    id: 'app-theme-midnight', 
    name: '午夜紫', 
    category: '限定系列', 
    price: 20, 
    colors: { 
      bg: '#1e1b4b', 
      card: '#312e81', 
      text: '#eef2ff',
      border: '#4338ca',
      accent: '#a78bfa'
    } 
  },
  { 
    id: 'app-theme-rose', 
    name: '玫瑰金', 
    category: '限定系列', 
    price: 20, 
    colors: { 
      bg: '#4c0519', 
      card: '#831843', 
      text: '#fce7f3',
      border: '#9f1239',
      accent: '#f472b6'
    } 
  },
];



// Achievements - Auto-unlocked, not for sale
export const ACHIEVEMENTS = [
  { id: 'achievement-first-demo', name: '初出茅庐', description: '发布第一个演示', requirement: '发布1个演示' },
  { id: 'achievement-5-demos', name: '小有成就', description: '发布5个演示', requirement: '发布5个演示' },
  { id: 'achievement-20-demos', name: '著作等身', description: '发布20个演示', requirement: '发布20个演示' },
  { id: 'achievement-100-likes', name: '人气王', description: '获得100个点赞', requirement: '获得100个点赞' },
  { id: 'achievement-10-communities', name: '社交达人', description: '加入10个社区', requirement: '加入10个社区' },
  { id: 'achievement-50-comments', name: '评论专家', description: '发表50条评论', requirement: '发表50条评论' },
  { id: 'achievement-30-favorites', name: '收藏爱好者', description: '收藏30个演示', requirement: '收藏30个演示' },
  { id: 'achievement-year-veteran', name: '年度老兵', description: '注册满一年', requirement: '注册满一年' },
  { id: 'achievement-helpful-hand', name: '助人为乐', description: '帮助10位用户', requirement: '帮助10位用户' },
  { id: 'achievement-perfect-review', name: '完美评审', description: '审核通过50个程序', requirement: '审核通过50个程序' },
];

// Achievement Wall Styles
export const ACHIEVEMENT_WALL_STYLES = [
  { id: 'wall-golden-frame', name: '金色相框', price: 8 },
  { id: 'wall-crystal-display', name: '水晶展示', price: 10 },
  { id: 'wall-neon-showcase', name: '霓虹橱窗', price: 12 },
  { id: 'wall-royal-gallery', name: '皇家画廊', price: 15 },
  { id: 'wall-cosmic-exhibition', name: '宇宙展厅', price: 18 },
  { id: 'wall-magic-podium', name: '魔法展台', price: 20 },
];

// Common Tags for demos
export const COMMON_TAGS = [
  { id: 'tag-interactive', name: 'Interactive', nameCn: '互动', color: '#3b82f6' },
  { id: 'tag-simulation', name: 'Simulation', nameCn: '模拟', color: '#10b981' },
  { id: 'tag-visualization', name: 'Visualization', nameCn: '可视化', color: '#8b5cf6' },
  { id: 'tag-animation', name: 'Animation', nameCn: '动画', color: '#f59e0b' },
  { id: 'tag-game', name: 'Game', nameCn: '游戏', color: '#ef4444' },
  { id: 'tag-educational', name: 'Educational', nameCn: '教育', color: '#06b6d4' },
  { id: 'tag-art', name: 'Art', nameCn: '艺术', color: '#ec4899' },
  { id: 'tag-3d', name: '3D', nameCn: '3D', color: '#14b8a6' },
  { id: 'tag-physics', name: 'Physics', nameCn: '物理', color: '#6366f1' },
  { id: 'tag-math', name: 'Math', nameCn: '数学', color: '#0ea5e9' },
  { id: 'tag-chemistry', name: 'Chemistry', nameCn: '化学', color: '#f97316' },
  { id: 'tag-biology', name: 'Biology', nameCn: '生物', color: '#22c55e' },
  { id: 'tag-cs', name: 'Computer Science', nameCn: '计算机', color: '#a855f7' },
  { id: 'tag-astronomy', name: 'Astronomy', nameCn: '天文', color: '#0891b2' },
  { id: 'tag-beginner', name: 'Beginner', nameCn: '入门', color: '#84cc16' },
  { id: 'tag-advanced', name: 'Advanced', nameCn: '进阶', color: '#dc2626' },
  { id: 'tag-experiment', name: 'Experiment', nameCn: '实验', color: '#eab308' },
];

// Get tag display name based on language
export const getTagName = (tagId: string, lang: Language) => {
  const tag = COMMON_TAGS.find(t => t.id === tagId);
  if (!tag) return tagId;
  return lang === 'cn' ? tag.nameCn : tag.name;
};

// Get tag color
export const getTagColor = (tagId: string) => {
  const tag = COMMON_TAGS.find(t => t.id === tagId);
  return tag?.color || '#94a3b8';
};

