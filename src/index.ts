import express from "express";
import fileManagementRouter from "./api/fileManagement";
import projectRoutes from "./api/projectRoutes";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", fileManagementRouter);
app.use("/api", projectRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
