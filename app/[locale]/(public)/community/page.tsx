"use client";

import * as React from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { compressImage } from "@/utils/image-compression";
import { uploadListingImage } from "@/utils/supabase/storage";
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Share2, 
  Sparkles, 
  Trophy, 
  HelpCircle, 
  Shuffle, 
  Camera, 
  Plus, 
  Search, 
  Send, 
  X, 
  Check, 
  Loader2, 
  TrendingUp, 
  Sprout, 
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface CommunityPost {
  id: string;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  category: "QA" | "IDENTIFY" | "SHOWCASE" | "SWAP" | "CONTEST";
  title: string;
  content: string;
  image_url?: string;
  upvotes_count: number;
  comments_count: number;
  created_at: string;
  comments?: { id: string; author_name: string; content: string; created_at: string }[];
}

const CATEGORIES = [
  { id: "ALL", label: "ყველა თემა", icon: Users },
  { id: "QA", label: "❓ კითხვა-პასუხი & რჩევები", icon: HelpCircle },
  { id: "SHOWCASE", label: "🌿 ჩემი ორანჟერეა / ფოტოები", icon: Sprout },
  { id: "IDENTIFY", label: "🔍 მცენარის ამოცნობა", icon: Sparkles },
  { id: "SWAP", label: "🔄 გაცვლა & ჩუქება", icon: Shuffle },
  { id: "CONTEST", label: "🏆 ფოტო-კონკურსი", icon: Trophy },
];

const SEED_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    author_name: "ნინო ჩხეიძე",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    category: "SHOWCASE",
    title: "ჩემი Philodendron Pink Princess-ის ახალი, თითქმის ნახევრად ვარდისფერი ფოთოლი! 🌸",
    content: "3 თვე ველოდი ამ ფოთოლს. კაშკაშა გაფანტულმა სინათლემ და ტენიანობის მომატებამ საოცარი ვარიეგაცია მისცა!",
    image_url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80",
    upvotes_count: 34,
    comments_count: 6,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    comments: [
      { id: "c1", author_name: "გიორგი", content: "საოცარი ფერია! რა სასუქს აძლევ?", created_at: "2 საათის წინ" },
      { id: "c2", author_name: "ნინო ჩხეიძე", content: "თხევად ბიო-ჰუმუსს თვეში 2-ჯერ 🌱", created_at: "1 საათის წინ" },
    ],
  },
  {
    id: "post-2",
    author_name: "ლაშა მებუკე",
    author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    category: "QA",
    title: "რატომ უყვითლდება მონსტერას ქვედა ფოთლები? მორწყვას ვუკლებ თუ ზედმეტი მომდის?",
    content: "კვირაში ერთხელ ვრწყავ, ნიადაგის ზედაპირი მშრალი ჩანს, მაგრამ ფოთლის კიდეები გაყვითლდა და დარბილდა. მირჩიეთ რამე.",
    image_url: "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=800&q=80",
    upvotes_count: 19,
    comments_count: 8,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    comments: [
      { id: "c3", author_name: "მარიამი", content: "ფესვების შემოწმება მოგიწევს, სავარაუდოდ ქოთნის ძირში დგება წყალი. გადარგე პერლიტიან ნიადაგში!", created_at: "5 საათის წინ" },
    ],
  },
  {
    id: "post-3",
    author_name: "სალომე კ.",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    category: "SWAP",
    title: "გავცვლი დაფესვიანებულ სინგონიუმს (Syngonium Albo) ფილოდენდრონის ტოტზე 🌿",
    content: "თბილისი, ვაკე/საბურთალო. ჯანმრთელი, აქტიურად მზარდი 2-ფოთლიანი კალამი. შემეხმიანეთ პირადში ან WhatsApp-ზე.",
    image_url: "https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=800&q=80",
    upvotes_count: 22,
    comments_count: 4,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    comments: [],
  },
];

export default function CommunityPage() {
  const locale = useLocale();
  const isKa = locale !== "en";
  const supabase = createClient();
  const router = useRouter();

  const [posts, setPosts] = React.useState<CommunityPost[]>(SEED_POSTS);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [user, setUser] = React.useState<any>(null);

  // Upvote state tracking
  const [likedPosts, setLikedPosts] = React.useState<Set<string>>(new Set());

  // Expand Comments State
  const [expandedCommentsPostId, setExpandedCommentsPostId] = React.useState<string | null>(null);
  const [commentInput, setCommentInput] = React.useState<string>("");

  // Create Post Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [formTitle, setFormTitle] = React.useState("");
  const [formCategory, setFormCategory] = React.useState<CommunityPost["category"]>("QA");
  const [formContent, setFormContent] = React.useState("");
  const [formImageFile, setFormImageFile] = React.useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    async function loadDbPosts() {
      try {
        const { data, error } = await supabase
          .from("community_posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setPosts([...data, ...SEED_POSTS]);
        }
      } catch (err) {
        console.warn("Using seed posts:", err);
      }
    }
    loadDbPosts();
  }, [supabase]);

  // Handle Upvote
  const handleToggleLike = (postId: string) => {
    const isLiked = likedPosts.has(postId);
    const updated = new Set(likedPosts);

    if (isLiked) {
      updated.delete(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, upvotes_count: p.upvotes_count - 1 } : p))
      );
    } else {
      updated.add(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, upvotes_count: p.upvotes_count + 1 } : p))
      );
    }
    setLikedPosts(updated);
  };

  // Handle Add Comment
  const handleAddComment = (postId: string) => {
    if (!commentInput.trim()) return;

    const authorName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "მებაღე";
    const newComment = {
      id: `c-${Date.now()}`,
      author_name: authorName,
      content: commentInput.trim(),
      created_at: "ახლახანს",
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments_count: p.comments_count + 1,
              comments: [...(p.comments || []), newComment],
            }
          : p
      )
    );

    setCommentInput("");
  };

  // Handle Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setSubmitting(true);
    try {
      let finalImgUrl = "";

      if (formImageFile && user) {
        const compressed = await compressImage(formImageFile, {
          maxDimension: 1200,
          quality: 0.85,
          mimeType: "image/jpeg",
        });
        const { url, error } = await uploadListingImage(compressed, user.id);
        if (!error && url) finalImgUrl = url;
      }

      const authorName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "მცენარის მოყვარული";
      const authorAvatar = user?.user_metadata?.avatar_url || null;

      const newPost: CommunityPost = {
        id: `p-${Date.now()}`,
        author_id: user?.id,
        author_name: authorName,
        author_avatar: authorAvatar,
        category: formCategory,
        title: formTitle.trim(),
        content: formContent.trim(),
        image_url: finalImgUrl || formImagePreview || undefined,
        upvotes_count: 1,
        comments_count: 0,
        created_at: new Date().toISOString(),
        comments: [],
      };

      setPosts((prev) => [newPost, ...prev]);

      // Try inserting to DB
      if (user) {
        await supabase.from("community_posts").insert({
          author_id: user.id,
          author_name: authorName,
          author_avatar: authorAvatar,
          category: formCategory,
          title: formTitle.trim(),
          content: formContent.trim(),
          image_url: finalImgUrl || null,
        });
      }

      setModalOpen(false);
      setFormTitle("");
      setFormContent("");
      setFormImageFile(null);
      setFormImagePreview("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = React.useMemo(() => {
    return posts.filter((p) => {
      if (selectedCategory !== "ALL" && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.author_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [posts, selectedCategory, searchQuery]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl space-y-8">
      {/* 1. Header Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-black">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isKa ? "მებაღეთა კლუბი & ფიდი" : "Plant Community & Feed"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {isKa ? "💬 მებაღეთა კომუნა & რჩევები" : "Plant Community & Q&A"}
          </h1>
          <p className="text-xs text-muted-foreground">
            გააზიარეთ თქვენი მცენარეების ფოტოები, დასვით კითხვები და გაიცანით სხვა მცენარის მოყვარულები.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            if (!user) {
              router.push("/login?next=/community");
              return;
            }
            setModalOpen(true);
          }}
          className="h-11 rounded-[14px] bg-primary hover:bg-primary/90 text-white text-xs font-black gap-2 shadow-ambient cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isKa ? "პოსტის დამატება" : "Create Post"}</span>
        </Button>
      </div>

      {/* 2. Monthly Photo Contest Banner */}
      <div className="rounded-[24px] bg-gradient-to-r from-amber-500/15 via-primary/10 to-emerald-500/15 border border-amber-500/30 p-5 sm:p-6 shadow-ambient flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[16px] bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-md">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                აგვისტოს კონკურსი
              </span>
              <span className="text-xs font-bold text-muted-foreground">🏆 პრიზი: 100 ₾ ვაუჩერი</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-foreground mt-0.5">
              „თვის ყველაზე ლამაზი ოთახის ჯუნგლები“
            </h3>
            <p className="text-xs text-muted-foreground">
              ატვირთეთ თქვენი მცენარეების კუთხის ფოტო ჰეშთეგით #კონკურსი და მიიღეთ ხმები!
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setFormCategory("CONTEST");
            setFormTitle("🏆 ჩემი მწვანე კუთხე (#კონკურსი)");
            setModalOpen(true);
          }}
          className="rounded-[12px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-black gap-1.5 shrink-0 shadow-xs cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>მონაწილეობის მიღება</span>
        </Button>
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-[14px] text-xs font-black whitespace-nowrap transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary text-white shadow-ambient scale-102"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border/80"
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Posts Feed */}
      <div className="space-y-5">
        {filteredPosts.map((post) => {
          const isLiked = likedPosts.has(post.id);
          const isCommentsExpanded = expandedCommentsPostId === post.id;
          const postDate = new Date(post.created_at).toLocaleDateString("ka-GE", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={post.id}
              className="rounded-[24px] border border-border/80 bg-card p-5 sm:p-6 shadow-2xs hover:shadow-ambient transition-all space-y-4"
            >
              {/* Top: Author & Category */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {post.author_avatar ? (
                    <img
                      src={post.author_avatar}
                      alt={post.author_name}
                      className="h-10 w-10 rounded-full object-cover border border-border shadow-2xs"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                      {post.author_name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-foreground">
                      {post.author_name}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">{postDate}</span>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] font-black bg-surface-container/50">
                  {CATEGORIES.find((c) => c.id === post.category)?.label.split(" ")[0]} {post.category}
                </Badge>
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-black text-foreground leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Attached Photo */}
              {post.image_url && (
                <div className="relative rounded-[20px] overflow-hidden bg-surface-container max-h-[420px] border border-border/60">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Actions: Upvote, Comment, Share */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                <div className="flex items-center gap-2">
                  {/* Upvote Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    className={`px-3 py-1.5 rounded-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isLiked
                        ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                        : "bg-surface-container/60 hover:bg-surface-container text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-600" : ""}`} />
                    <span>{post.upvotes_count}</span>
                  </button>

                  {/* Comment Trigger */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCommentsPostId(isCommentsExpanded ? null : post.id)
                    }
                    className="px-3 py-1.5 rounded-[12px] bg-surface-container/60 hover:bg-surface-container text-muted-foreground hover:text-foreground font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <span>{post.comments_count} კომენტარი</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("ბმული დაკოპირდა!");
                  }}
                  className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="გაზიარება"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expandable Comments Thread */}
              {isCommentsExpanded && (
                <div className="pt-3 border-t border-border/40 space-y-3 animate-in fade-in">
                  {/* Comments List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(!post.comments || post.comments.length === 0) ? (
                      <p className="text-[11px] text-muted-foreground text-center py-2">
                        კომენტარები ჯერ არ არის — დაწერეთ პირველი!
                      </p>
                    ) : (
                      post.comments.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-[14px] bg-surface-container/40 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-foreground">{c.author_name}</span>
                            <span className="text-[10px] text-muted-foreground">{c.created_at}</span>
                          </div>
                          <p className="text-muted-foreground">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex gap-2">
                    <Input
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                      placeholder="დაწერეთ კომენტარი / პასუხი..."
                      className="h-9 text-xs rounded-[12px] bg-background"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      className="h-9 px-3 rounded-[12px] bg-primary text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Create Post Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-[24px] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-foreground">
                  ახალი პოსტის შექმნა
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 overflow-y-auto flex-1 p-1">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">კატეგორია *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-[12px] border border-input bg-card text-xs font-bold text-foreground outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="QA">❓ კითხვა-პასუხი & რჩევები</option>
                  <option value="SHOWCASE">🌿 ჩემი ორანჟერეა / ფოტოები</option>
                  <option value="IDENTIFY">🔍 მცენარის ამოცნობა</option>
                  <option value="SWAP">🔄 გაცვლა & ჩუქება</option>
                  <option value="CONTEST">🏆 ფოტო-კონკურსი</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">სათაური *</label>
                <Input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="მაგ: როგორ გავამრავლო მონსტერა წყალში?"
                  className="h-10 rounded-[12px] text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">ტექსტი / აღწერა *</label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="დაწერეთ თქვენი შეკითხვა ან გაუზიარეთ გამოცდილება მებაღეთა საზოგადოებას..."
                  className="w-full rounded-[12px] border border-input bg-background p-2.5 text-xs font-medium focus:ring-1 focus:ring-primary outline-hidden resize-none"
                />
              </div>

              {/* Photo Attachment */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const f = e.target.files[0];
                      setFormImageFile(f);
                      setFormImagePreview(URL.createObjectURL(f));
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-[12px] bg-secondary-container text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-surface-container"
                >
                  <Camera className="w-4 h-4 text-primary" />
                  <span>{formImagePreview ? "ფოტოს შეცვლა" : "ფოტოს მიმაგრება"}</span>
                </button>
                {formImagePreview && (
                  <div className="mt-2 relative h-32 rounded-[14px] overflow-hidden border">
                    <img src={formImagePreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="rounded-[10px] text-xs"
                >
                  გაუქმება
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[10px] bg-primary hover:bg-primary/90 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-ambient"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>გამოქვეყნება</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
