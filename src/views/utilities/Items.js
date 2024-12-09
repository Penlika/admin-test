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
  const [blendedBeverages, setBlendedBeverages] = useState([]);
  const [milkJuiceMore, setMilkJuiceMore] = useState([]);
  
  const [currentItem, setCurrentItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [itemType, setItemType] = useState(""); 
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const teaCollectionRef = collection(db, "tea");
  const coffeeCollectionRef = collection(db, "coffee");
  const blendedBeveragesCollectionRef = collection(db, "blended_beverages");
  const milkJuiceMoreCollectionRef = collection(db, "milk_juice_more");
  
  const storage = getStorage();

  const fetchData = async () => {
    const teaData = await getDocs(teaCollectionRef);
    const coffeeData = await getDocs(coffeeCollectionRef);
    const blendedData = await getDocs(blendedBeveragesCollectionRef);
    const milkJuiceData = await getDocs(milkJuiceMoreCollectionRef);
    
    setTea(teaData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    setCoffee(coffeeData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    setBlendedBeverages(blendedData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    setMilkJuiceMore(milkJuiceData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveItem = async () => {
    let collectionRef;
    switch(itemType) {
      case "Tea": collectionRef = teaCollectionRef; break;
      case "Coffee": collectionRef = coffeeCollectionRef; break;
      case "Blended Beverages": collectionRef = blendedBeveragesCollectionRef; break;
      case "Milk, Juice & More": collectionRef = milkJuiceMoreCollectionRef; break;
      default: return;
    }

    let imageUrl = currentItem.imagelink_square || "";  
  
    if (imageFile) {
      const imageRef = ref(storage, `${itemType.toLowerCase().replace(/\s+/g, '_')}/${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }
  
    const itemData = {
      ...currentItem,
      imagelink_square: imageUrl,
      special_ingredient: currentItem.special_ingredient || "",
      average_rating: currentItem.average_rating || 0,
      ratings_count: currentItem.ratings_count || 0,
      ingredients: currentItem.ingredients || [],
      prices: currentItem.prices || [],
    };
  
    if (isEditing) {
      const itemDoc = doc(db, itemType.toLowerCase().replace(/\s+/g, '_'), currentItem.id);
      await updateDoc(itemDoc, itemData);
    } else {
      await addDoc(collectionRef, itemData);
    }
  
    fetchData();
    handleCloseDialog();
  };

  const handleDeleteItem = async (id, type) => {
    let collectionRef;
    switch(type) {
      case "Tea": collectionRef = teaCollectionRef; break;
      case "Coffee": collectionRef = coffeeCollectionRef; break;
      case "Blended Beverages": collectionRef = blendedBeveragesCollectionRef; break;
      case "Milk, Juice & More": collectionRef = milkJuiceMoreCollectionRef; break;
      default: return;
    }
    const itemDoc = doc(db, type.toLowerCase().replace(/\s+/g, '_'), id);
    await deleteDoc(itemDoc);
    fetchData();
  };

  const handleOpenAddDialog = (type) => {
    setItemType(type);
    setCurrentItem({
      name: "",
      description: "",
      roasted: "",
      special_ingredient: "",
      average_rating: 0,
      ratings_count: 0,
      ingredients: [],
      prices: [], 
    });
    setImageFile(null);
    setPreviewImage(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const ItemCard = ({ item, type }) => (
    <Grid item xs={12} sm={6} md={4} key={item.id}>
      <Card
        sx={{
          position: "relative",
          transition: "transform 0.2s, opacity 0.2s",
          "&:hover": {
            transform: "translateY(-20px)", 
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
            transition: "opacity 0.3s ease-in-out, bottom 0.3s ease-in-out", 
            "&:hover": {
              opacity: 1,
              bottom: 0,
            },
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
              fontSize: "2.5rem", 
            }}
          >
            <Typography variant="h9">{item.name}</Typography>
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: 0,
              width: "100%",
              height: "100%",
              color: "white",
              fontSize: "1rem",
              opacity: 0,
              transition: "opacity 0.3s ease-in-out, bottom 0.3s ease-in-out", 
              overflow: "hidden", 
              "&:hover": {
                opacity: 1,
                bottom: 0, 
              },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                display: "-webkit-box", 
                WebkitBoxOrient: "vertical",
                overflow: "hidden", 
                textOverflow: "ellipsis",
                WebkitLineClamp: 4, 
                height: "5.5em", 
                lineHeight: "1.4em", 
              }}
            >
              {item.description} 
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

        <Typography variant="body2" sx={{ padding: 1 }}>
          Prices: {item.prices.map((p) => `${p.size}: $${p.price}`).join(", ")}
        </Typography>
      </Card>
    </Grid>
  );

  return (
    <Container>
      <Typography variant="h4" align="center" gutterBottom>
        Menu Item Management
      </Typography>

      {/* Tea Section */}
      <Typography variant="h5" gutterBottom>Tea</Typography>
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
      <Typography variant="h5" mt={4} gutterBottom>Coffee</Typography>
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

      {/* Blended Beverages Section */}
      <Typography variant="h5" mt={4} gutterBottom>Blended Beverages</Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenAddDialog("Blended Beverages")}
      >
        Add Blended Beverages
      </Button>
      <Grid container spacing={2} mt={2}>
        {blendedBeverages.map((item) => (
          <ItemCard key={item.id} item={item} type="Blended Beverages" />
        ))}
      </Grid>

      {/* Milk, Juice & More Section */}
      <Typography variant="h5" mt={4} gutterBottom>Milk, Juice & More</Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenAddDialog("Milk, Juice & More")}
      >
        Add Milk, Juice & More
      </Button>
      <Grid container spacing={2} mt={2}>
        {milkJuiceMore.map((item) => (
          <ItemCard key={item.id} item={item} type="Milk, Juice & More" />
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={isAdding || isEditing} onClose={handleCloseDialog}>
        <DialogTitle>{isAdding ? "Add Item" : "Edit Item"}</DialogTitle>
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
            multiline
            rows={4}
            value={currentItem?.description || ""}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, description: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Special Ingredient"
            fullWidth
            value={currentItem?.special_ingredient || ""}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, special_ingredient: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Average Rating"
            fullWidth
            type="number"
            value={currentItem?.average_rating || 0}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, average_rating: +e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Ratings Count"
            fullWidth
            type="number"
            value={currentItem?.ratings_count || 0}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, ratings_count: +e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Ingredients (comma separated)"
            fullWidth
            value={currentItem?.ingredients.join(", ") || ""}
            onChange={(e) =>
              setCurrentItem({
                ...currentItem,
                ingredients: e.target.value.split(",").map((str) => str.trim()),
              })
            }
          />
          <TextField
            margin="dense"
            label="Base Price (Small Size)"
            fullWidth
            type="number"
            value={currentItem?.basePrice || ''}
            onChange={(e) => {
              const basePrice = parseFloat(e.target.value);
              setCurrentItem({
                ...currentItem,
                basePrice,
                prices: [
                  { 
                    size: 'Small', 
                    price: basePrice.toFixed(2) 
                  },
                  { 
                    size: 'Medium', 
                    price: (basePrice * 1.25).toFixed(2) 
                  },
                  { 
                    size: 'Large', 
                    price: (basePrice * 1.50).toFixed(2) 
                  }
                ]
              });
            }}
          />
          <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
            Upload Image
            <input type="file" hidden onChange={handleImageChange} />
          </Button>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              style={{ marginTop: 10, width: "100%", height: "auto" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveItem} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;