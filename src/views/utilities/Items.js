import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CardMedia,
  Box,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AdminDashboard = () => {
  const [tea, setTea] = useState([]);
  const [coffee, setCoffee] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [itemType, setItemType] = useState(""); // "Tea" or "Coffee"
  const [imageFile, setImageFile] = useState(null);

  const teaCollectionRef = collection(db, "tea");
  const coffeeCollectionRef = collection(db, "coffee");
  const storage = getStorage();

  const fetchData = async () => {
    const teaData = await getDocs(teaCollectionRef);
    const coffeeData = await getDocs(coffeeCollectionRef);
    setTea(teaData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    setCoffee(coffeeData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveItem = async () => {
    const collectionRef = itemType === "Tea" ? teaCollectionRef : coffeeCollectionRef;
    let imageUrl = currentItem.imagelink_square || "";

    if (imageFile) {
      const imageRef = ref(storage, `${itemType.toLowerCase()}/${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    if (isEditing) {
      const itemDoc = doc(db, itemType.toLowerCase(), currentItem.id);
      await updateDoc(itemDoc, { ...currentItem, imagelink_square: imageUrl });
    } else {
      await addDoc(collectionRef, { ...currentItem, imagelink_square: imageUrl });
    }

    fetchData();
    handleCloseDialog();
  };

  const handleDeleteItem = async (id, type) => {
    const collectionRef = type === "Tea" ? teaCollectionRef : coffeeCollectionRef;
    const itemDoc = doc(db, type.toLowerCase(), id);
    await deleteDoc(itemDoc);
    fetchData();
  };

  const handleOpenAddDialog = (type) => {
    setItemType(type);
    setCurrentItem({ name: "", description: "", roasted: "", prices: [] });
    setImageFile(null);
    setIsAdding(true);
  };

  const handleOpenEditDialog = (item, type) => {
    setItemType(type);
    setCurrentItem(item);
    setImageFile(null);
    setIsEditing(true);
  };

  const handleCloseDialog = () => {
    setCurrentItem(null);
    setImageFile(null);
    setIsAdding(false);
    setIsEditing(false);
  };

  const ItemCard = ({ item, type }) => (
    <Grid item xs={12} sm={6} md={4} key={item.id}>
      <Card
        sx={{
          position: "relative",
          transition: "transform 0.2s, opacity 0.2s",
          "&:hover": {
            transform: "translateY(-20px)", // Increased lift effect
          },
        }}
      >
        <CardMedia
          component="img"
          image={item.imagelink_square}
          alt={item.name}
          sx={{ height: 200 }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -50,
            width: "100%",
            height: "100%",
            background: "linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent)",
            transition: "opacity 0.3s ease-in-out, bottom 0.3s ease-in-out", // Smooth transition
            "&:hover": {
            opacity: 1,
            bottom: 0,
            } // Pane rises up when hovered
          }}
        >
            <Box
            sx={{
                position: "absolute",
                bottom: 20,
                left: 15,
                color: "white",
                fontWeight: "bold",
                textShadow: "2px 2px 4px black",
                transition: "all 0.2s",
                fontSize: "2.5rem", // Bigger font size for the name
            }}
            >
            <Typography variant="h9">{item.name}</Typography>
            </Box>

            {/* Description Pane initially hidden */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: -30, // Positioned below the card initially
                    left: 0,
                    width: "100%",
                    height: "100%",
                    color: "white",
                    fontSize: "1rem",
                    opacity: 0,
                    transition: "opacity 0.3s ease-in-out, bottom 0.3s ease-in-out", // Smooth transition
                    overflow: "hidden", // Hide overflowing content
                    "&:hover": {
                    opacity: 1,
                    bottom: 0, // Pane rises up when hovered
                    },
                }}
                >
  <Typography
    variant="body1"
    sx={{
      display: "-webkit-box", // Enables multiline truncation
      WebkitBoxOrient: "vertical",
      overflow: "hidden", // Required for truncation
      textOverflow: "ellipsis",
      WebkitLineClamp: 4, // Restrict to 4 lines
      height: "5.5em", // Line height adjustment (4 lines * line-height)
      lineHeight: "1.4em", // Set consistent line height
    }}
  >
    {item.description} {/* Dynamically truncate the text */}
  </Typography>
            </Box>
        </Box>

        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 1,
          }}
        >
          <IconButton
            sx={{
              color: "red",
              "&:hover": {
                color: "white",
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              },
            }}
            onClick={() => handleDeleteItem(item.id, type)}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            sx={{
              color: "blue",
              "&:hover": {
                color: "white",
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              },
            }}
            onClick={() => handleOpenEditDialog(item, type)}
          >
            <EditIcon />
          </IconButton>
        </Box>
      </Card>
    </Grid>
  );

  return (
    <Container>
      <Typography variant="h4" align="center" gutterBottom>
        Menu Item
      </Typography>

      {/* Tea Section */}
      <Typography variant="h5" gutterBottom>
        Tea
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenAddDialog("Tea")}
      >
        Add Tea
      </Button>
      <Grid container spacing={2} mt={2}>
        {tea.map((item) => (
          <ItemCard key={item.id} item={item} type="Tea" />
        ))}
      </Grid>

      {/* Coffee Section */}
      <Typography variant="h5" mt={4} gutterBottom>
        Coffee
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenAddDialog("Coffee")}
      >
        Add Coffee
      </Button>
      <Grid container spacing={2} mt={2}>
        {coffee.map((item) => (
          <ItemCard key={item.id} item={item} type="Coffee" />
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={isAdding || isEditing} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? "Edit Item" : "Add New Item"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={currentItem?.name || ""}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={currentItem?.description || ""}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, description: e.target.value })
            }
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
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </Button>
          {imageFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {imageFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveItem}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
