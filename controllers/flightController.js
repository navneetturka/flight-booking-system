const { listFlights, createFlight, updateFlight, deleteFlight, findById } = require("../models/flightModel");
const { emit } = require("../realtime/socketHub");

exports.getFlights = async (req, res) => {
    const flights = await listFlights();
    const editId = req.query && req.query.edit;
    const editFlight = editId ? flights.find(f => String(f.id) === String(editId)) : null;
    res.render("flights", { title: "Flights", flights, editFlight });
};

exports.createFlight = async (req, res) => {
	const { number, origin, destination, departAt, arriveAt, price } = req.body;
	if (!number || !origin || !destination || !departAt || !arriveAt || !price) {
		return res.status(400).send("Missing fields");
	}
    const flight = await createFlight({ number, origin, destination, departAt, arriveAt, price });
	emit("FLIGHT_CREATED", { flight });
	return res.redirect("/flights");
};

exports.updateFlight = async (req, res) => {
	const { id } = req.params;
    const flight = await updateFlight(id, req.body);
	if (!flight) return res.status(404).send("Not found");
	emit("FLIGHT_UPDATED", { flight });
	return res.redirect("/");
};

exports.deleteFlight = async (req, res) => {
	const { id } = req.params;
    const ok = await deleteFlight(id);
	if (!ok) return res.status(404).send("Not found");
	emit("FLIGHT_DELETED", { id });
	return res.redirect("/flights");
};


