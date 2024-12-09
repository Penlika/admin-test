import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  CardContent, 
  CircularProgress, 
  Card, 
  CardMedia, 
  Rating,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { collection, query, getDocs, getFirestore, deleteDoc, doc } from 'firebase/firestore';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from 'src/components/shared/DashboardCard';
import { db } from "../../firebase";

const AdminCommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const fetchAllComments = async () => {
    try {
      const db = getFirestore();
      const collectionsToSearch = ['coffee', 'tea', 'blended_beverages', 'milk_juice_more'];
      let allComments = [];

      // Fetch comments from each collection
      for (const collectionName of collectionsToSearch) {
        const collectionsRef = collection(db, collectionName);
        const collectionsSnapshot = await getDocs(collectionsRef);

        for (const docSnapshot of collectionsSnapshot.docs) {
          // Fetch comments subcollection for each document
          const commentsSubcollection = collection(
            db, 
            `${collectionName}/${docSnapshot.id}/CommentsAndRatings`
          );
          
          const commentsSnapshot = await getDocs(commentsSubcollection);

          commentsSnapshot.forEach((commentDoc) => {
            const commentData = commentDoc.data();
            const comment = {
              id: commentDoc.id,
              itemId: docSnapshot.id,
              itemName: docSnapshot.data().name || 'Unknown Item',
              itemType: collectionName,
              commentText: commentData.comment || '',
              rating: commentData.rating || 0,
              timestamp: commentData.timestamp,
              userId: commentData.userId,
              imagelink_square: docSnapshot.data().imagelink_square,
              parentCollectionName: collectionName,
              parentDocId: docSnapshot.id
            };
            allComments.push(comment);
          });
        }
      }

      // Sort comments by timestamp (most recent first)
      setComments(allComments.sort((a, b) => 
        (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
      ));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllComments();
  }, []);

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
  
    try {
      const { parentCollectionName, parentDocId, id: commentId } = commentToDelete;
  
      // Get reference to the parent document
      const parentDocRef = doc(db, parentCollectionName, parentDocId);
  
      // Fetch all comments for the item
      const commentsSnapshot = await getDocs(
        collection(db, `${parentCollectionName}/${parentDocId}/CommentsAndRatings`)
      );
  
      const allComments = commentsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
  
      // Filter out the comment being deleted
      const updatedComments = allComments.filter((comment) => comment.id !== commentId);
  
      // Recalculate ratings
      const validRatings = updatedComments.filter((comment) => comment.rating > 0);
      const updatedAverageRating =
        validRatings.length > 0
          ? validRatings.reduce((sum, comment) => sum + comment.rating, 0) / validRatings.length
          : 0;
  
      // Update the parent document with new ratings
      await parentDocRef.update({
        average_rating: updatedAverageRating,
        ratings_count: validRatings.length,
      });
  
      // Delete the specific comment
      const commentRef = doc(
        db,
        `${parentCollectionName}/${parentDocId}/CommentsAndRatings`,
        commentId
      );
      await deleteDoc(commentRef);
  
      // Update local state
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== commentId)
      );
      setDeleteConfirmOpen(false);
      setCommentToDelete(null);
  
      console.log('Comment deleted and ratings updated successfully.');
    } catch (error) {
      console.error('Error deleting comment and updating ratings:', error);
      // Optionally, show an error message to the user
    }
  };
  

  const openDeleteConfirmation = (comment) => {
    setCommentToDelete(comment);
    setDeleteConfirmOpen(true);
  };

  if (loading) {
    return (
      <PageContainer title="All Comments" description="Loading comments...">
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="All Comments" description="Error loading comments">
        <Typography variant="h6" color="error">
          Error loading comments: {error.message}
        </Typography>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer title="All Comments" description="Comments across all collections">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DashboardCard title="All Comments">
              {comments.length === 0 ? (
                <Typography variant="body1" align="center" sx={{ p: 3 }}>
                  No comments found.
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {comments.map((comment) => (
                    <Grid item xs={12} md={6} lg={4} key={comment.id}>
                      <Card 
                        sx={{ 
                          border: '1px solid rgba(0,0,0,0.12)', 
                          borderRadius: 2, 
                          boxShadow: 3,
                          position: 'relative',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.02)'
                          }
                        }}
                      >
                        <IconButton
                          aria-label="delete"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'error.main',
                            zIndex: 10
                          }}
                          onClick={() => openDeleteConfirmation(comment)}
                        >
                          <DeleteIcon />
                        </IconButton>

                        {comment.imagelink_square && (
                          <CardMedia
                            component="img"
                            sx={{ 
                              height: 200, 
                              objectFit: 'cover',
                              borderTopLeftRadius: 8,
                              borderTopRightRadius: 8
                            }}
                            image={comment.imagelink_square}
                            alt={comment.itemName}
                          />
                        )}
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {comment.itemName}
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            {comment.itemType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Rating 
                              value={comment.rating} 
                              readOnly 
                              precision={0.5}
                              sx={{ mr: 2 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {comment.timestamp?.toDate()?.toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            {comment.commentText}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            User ID: {comment.userId}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </DashboardCard>
          </Grid>
        </Grid>
      </PageContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-comment-dialog-title"
        aria-describedby="delete-comment-dialog-description"
      >
        <DialogTitle id="delete-comment-dialog-title">
          Delete Comment?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-comment-dialog-description">
            Are you sure you want to delete this comment? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteComment} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminCommentsPage;