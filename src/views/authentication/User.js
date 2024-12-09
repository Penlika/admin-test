import React, { useState, useEffect } from 'react';
import {
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { auth, createUserWithEmailAndPassword } from '../../firebase';
import './AdminPage.css';

const defaultProfilePicture = 'https://static.vecteezy.com/system/resources/previews/018/765/757/non_2x/user-profile-icon-in-flat-style-member-avatar-illustration-on-isolated-background-human-permission-sign-business-concept-vector.jpg';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    phone: '',
    profilePicture: '',
    address: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const db = getFirestore();
  const storage = getStorage();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
      const usersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setNewUser({ ...newUser, profilePicture: URL.createObjectURL(file) });
    }
  };

  const handleSaveUser = async () => {
    try {
      if (newUser.password !== newUser.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      if (!newUser.username.trim()) {
        alert('Username is required.');
        return;
      }

      // Check if username already exists
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '==', newUser.username)
      );
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        alert('Username already exists. Please choose a different one.');
        return;
      }

      if (isEditing) {
        const userDoc = doc(db, 'users', editingUserId);
        await updateDoc(userDoc, { ...newUser });
        setUsers(
          users.map((user) =>
            user.id === editingUserId ? { ...user, ...newUser } : user
          )
        );
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newUser.email,
          newUser.password
        );

        const docRef = await addDoc(collection(db, 'users'), {
          ...newUser,
          profilePicture: newUser.profilePicture || defaultProfilePicture,
          createdAt: new Date(),
        });

        setUsers([
          ...users,
          { id: docRef.id, email: newUser.email, profilePicture: newUser.profilePicture },
        ]);
      }

      setIsDialogOpen(false);
      setNewUser({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        phone: '',
        profilePicture: '',
        address: '',
      });
      setImageFile(null);
      setEditingUserId(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId, profilePicture) => {
    try {
      console.log('Deleting user with ID:', userId);

      if (profilePicture && profilePicture !== defaultProfilePicture) {
        const imageRef = ref(storage, profilePicture);
        await deleteObject(imageRef);
        console.log('Profile picture deleted from Storage.');
      }

      await deleteDoc(doc(db, 'users', userId));

      setUsers(users.filter((user) => user.id !== userId));
      console.log('User deleted successfully.');
    } catch (error) {
      console.error('Error deleting user:', error.message);
      alert(`Error deleting user: ${error.message}`);
    }
  };

  const openDialog = (user = null) => {
    if (user) {
      setNewUser({
        email: user.email,
        password: '',
        confirmPassword: '',
        username: user.username || '',
        phone: user.phone || '',
        profilePicture: user.profilePicture || '',
        address: user.address || '',
      });
      setEditingUserId(user.id);
      setIsEditing(true);
    } else {
      setNewUser({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        phone: '',
        profilePicture: '',
        address: '',
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setNewUser({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      phone: '',
      profilePicture: '',
      address: '',
    });
    setImageFile(null);
    setEditingUserId(null);
    setIsEditing(false);
  };

  return (
    <>
      <CssBaseline />
      <div className="admin-page">
        <h1>Admin Dashboard</h1>
        <div className="admin-layout">
          <section className="user-list">
            <h2>Registered Users</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <img
                          src={user.profilePicture || defaultProfilePicture}
                          alt="User Icon"
                          className="profile-picture"
                        />
                      </td>
                      <td>{user.email || 'No information'}</td>
                      <td>{user.username || 'No information'}</td>
                      <td>{user.phone || 'No information'}</td>
                      <td>{user.address || 'No information'}</td>
                      <td>
                        <Button onClick={() => openDialog(user)}>Edit</Button>
                        <Button onClick={() => handleDeleteUser(user.id, user.profilePicture)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="add-user">
            <Button
              variant="contained"
              onClick={() => openDialog()}
            >
              Add User
            </Button>
          </section>
        </div>

        <Dialog open={isDialogOpen} onClose={closeDialog}>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Email (required)"
              fullWidth
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required={!isEditing}
            />
            <TextField
              margin="dense"
              label="Confirm Password"
              type="password"
              fullWidth
              value={newUser.confirmPassword}
              onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
              required={!isEditing}
            />
            <TextField
              margin="dense"
              label="Username (required)"
              fullWidth
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Phone"
              fullWidth
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Address"
              fullWidth
              value={newUser.address}
              onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
            />
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mt: 2 }}
            >
              Upload Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {imageFile && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Selected"
                  style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '10px', borderRadius: '5px' }}
                />
                <Typography variant="body2">
                  Selected file: {imageFile.name}
                </Typography>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSaveUser}>Save</Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default AdminPage;
