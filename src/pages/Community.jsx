import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import './Community.css';

const Community = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState(null);
    const [activeCommentPost, setActiveCommentPost] = useState(null);
    const [commentText, setCommentText] = useState('');

    // Initial load
    useEffect(() => {
        const storedPosts = localStorage.getItem('communityPosts');
        if (storedPosts) {
            setPosts(JSON.parse(storedPosts));
        } else {
            // Seed data with more premium feel
            const seeds = [
                {
                    id: 1,
                    user: 'Sarah & Max',
                    avatar: '🐶',
                    content: 'Max learned a new trick today! High five! ✋🐕 We are so proud of his progress in the training sessions.',
                    image: null,
                    likes: 12,
                    comments: [
                        { id: 101, user: 'John', text: 'Good boy Max! Such a smart pup! ❤️', timestamp: new Date(Date.now() - 1800000).toISOString() }
                    ],
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: 2,
                    user: 'VetDr_Smith',
                    avatar: '👨‍⚕️',
                    content: 'Reminder: Tick season is starting. Check your pets after walks! Early prevention is the best treatment for our furry friends. 🩺',
                    image: null,
                    likes: 45,
                    comments: [],
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                }
            ];
            setPosts(seeds);
            localStorage.setItem('communityPosts', JSON.stringify(seeds));
        }
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPostImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePostSubmit = (e) => {
        e.preventDefault();
        if (!newPostContent.trim() && !newPostImage) return;

        const newPost = {
            id: Date.now(),
            user: 'You',
            avatar: '👤',
            content: newPostContent,
            image: newPostImage,
            likes: 0,
            comments: [],
            timestamp: new Date().toISOString()
        };

        const updated = [newPost, ...posts];
        setPosts(updated);
        localStorage.setItem('communityPosts', JSON.stringify(updated));

        setNewPostContent('');
        setNewPostImage(null);
    };

    const handleLike = (postId) => {
        const updated = posts.map(post => {
            if (post.id === postId) {
                return { ...post, likes: post.likes + 1 };
            }
            return post;
        });
        setPosts(updated);
        localStorage.setItem('communityPosts', JSON.stringify(updated));
    };

    const handleCommentToggle = (postId) => {
        if (activeCommentPost === postId) {
            setActiveCommentPost(null);
        } else {
            setActiveCommentPost(postId);
            setCommentText('');
        }
    };

    const handleAddComment = (postId) => {
        if (!commentText.trim()) return;

        const updated = posts.map(post => {
            if (post.id === postId) {
                const newComment = {
                    id: Date.now(),
                    user: 'You',
                    text: commentText,
                    timestamp: new Date().toISOString()
                };
                return {
                    ...post,
                    comments: [...post.comments, newComment]
                };
            }
            return post;
        });

        setPosts(updated);
        localStorage.setItem('communityPosts', JSON.stringify(updated));
        setCommentText('');
    };

    const handleDeletePost = (postId) => {
        const updated = posts.filter(post => post.id !== postId);
        setPosts(updated);
        localStorage.setItem('communityPosts', JSON.stringify(updated));
    };

    const handleDeleteComment = (postId, commentId) => {
        const updated = posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: post.comments.filter(comment => comment.id !== commentId)
                };
            }
            return post;
        });
        setPosts(updated);
        localStorage.setItem('communityPosts', JSON.stringify(updated));
    };

    return (
        <div className="community-page">
            <div className="community-glass-bg"></div>
            <div className="community-container">
                <header className="community-header">
                    <button className="back-btn-v2" onClick={() => navigate('/home')}>
                        <span className="icon">←</span> Back
                    </button>
                    <h1 className="premium-title">Pet Community<span>🐾</span></h1>
                    <div className="header-decoration"></div>
                </header>

                <main className="community-main">
                    <section className="create-post-v2">
                        <div className="user-info-mini">
                            <div className="mini-avatar">👤</div>
                            <span>What's on your pet's mind?</span>
                        </div>
                        <form onSubmit={handlePostSubmit}>
                            <textarea
                                className="post-input-v2"
                                placeholder="Share a story, question or cute photo..."
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                            />
                            {newPostImage && (
                                <div className="preview-container-v2">
                                    <img src={newPostImage} alt="Preview" />
                                    <button type="button" onClick={() => setNewPostImage(null)} className="remove-preview">✕</button>
                                </div>
                            )}
                            <div className="post-actions-v2">
                                <label className="image-upload-v2">
                                    <span className="icon">📸</span>
                                    <span>Photo</span>
                                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                </label>
                                <button type="submit" className="post-submit-btn" disabled={!newPostContent && !newPostImage}>
                                    Post Moment
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="feed-v2">
                        {posts.map(post => (
                            <article key={post.id} className="post-card-v2">
                                <div className="post-header-v2">
                                    <div className="post-author-v2">
                                        <div className="author-avatar-v2">
                                            {post.avatar || (post.user ? post.user[0].toUpperCase() : '👤')}
                                        </div>
                                        <div className="author-info-v2">
                                            <span className="author-name-v2">{post.user}</span>
                                            <span className="post-date-v2">{new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    {post.user === 'You' && (
                                        <button 
                                            className="delete-btn-v2" 
                                            onClick={() => handleDeletePost(post.id)}
                                            title="Delete Post"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>

                                <div className="post-content-v2">
                                    <p>{post.content}</p>
                                    {post.image && <img src={post.image} alt="Post content" className="post-image-v2" />}
                                </div>

                                <div className="post-stats-v2">
                                    <span className="stat-item">❤️ {post.likes} likes</span>
                                    <span className="stat-item">💬 {post.comments.length} comments</span>
                                </div>

                                <div className="post-actions-bar-v2">
                                    <button className="action-btn-v2" onClick={() => handleLike(post.id)}>
                                        <span className="icon">❤️</span> Like
                                    </button>
                                    <button className="action-btn-v2" onClick={() => handleCommentToggle(post.id)}>
                                        <span className="icon">💬</span> Comment
                                    </button>
                                </div>

                                {activeCommentPost === post.id && (
                                    <div className="comments-section-v2">
                                        <div className="comments-list-v2">
                                            {post.comments.map(comment => (
                                                <div key={comment.id} className="comment-item-v2">
                                                    <div className="comment-header-v2">
                                                        <span className="comment-user-v2">{comment.user}</span>
                                                        {comment.user === 'You' && (
                                                            <button 
                                                                className="delete-comment-btn" 
                                                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                                                title="Delete Comment"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="comment-text-v2">{comment.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="add-comment-v2">
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                            />
                                            <button onClick={() => handleAddComment(post.id)}>Post</button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}
                    </section>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Community;
