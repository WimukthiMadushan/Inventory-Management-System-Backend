import WorkSite from "./../Models/WorkSitesModel.js";
import Item from "./../Models/Item.js";

export const GetAllSites = (req, res) => {
    const searchQuery = req.query.search;
    let filter = {};
    if (searchQuery) {
        filter = {
            workSiteName: { $regex: searchQuery, $options: "i" },
        };
    }
    WorkSite.find(filter)
        .then(sites => {
            res.status(200).json(sites);
        })
        .catch(err => {
            res.status(500).json({ message: "Error fetching work sites", error: err });
        });
}
export const AddSite = (req, res) => {
    // Add a new work site to the database
    const { workSiteName, address, workSiteManager } = req.body;
    const newWorkSite = new WorkSite({
        workSiteName,
        address,
        workSiteManager
    });
    newWorkSite.save()
        .then(site => {
            res.status(201).json(site);
        })
        .catch(err => {
            res.status(500).json({ message: "Error adding work site", error: err });
        });
}
export const DeleteWorkStation = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSite = await WorkSite.findByIdAndDelete(id);

    if (!deletedSite) {
      return res.status(404).json({ message: "Work site not found" });
    }
    // Respond to client first
    res.status(200).json({ message: "Work site deleted successfully" });

    Item.deleteMany({ workSiteId: id })
      .then(() => {})
      .catch((err) => {});

  } catch (err) {
    return res.status(500).json({ message: "Error deleting work site", error: err });
  }
};

export const UpdateWorkStation = (req, res) => {
  const { id } = req.params;
  const { workSiteName, address, workSiteManager } = req.body;

  WorkSite.findByIdAndUpdate(
    id,
    { workSiteName, address, workSiteManager },
    { new: true, runValidators: true } // `new: true` returns updated doc, `runValidators` ensures validation rules are applied
  )
    .then(site => {
      if (site) {
        res.status(200).json(site);
      } else {
        res.status(404).json({ message: "Work site not found" });
      }
    })
    .catch(err => {
      res.status(500).json({ message: "Error updating work site", error: err });
    });
};

