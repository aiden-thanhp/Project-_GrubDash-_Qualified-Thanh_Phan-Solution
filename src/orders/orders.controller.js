const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

const bodyDataHas = (propertyName) => {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName] && data[propertyName] !== "") {
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        });
    }
}

const dishesPropertyIsValid = (req, res, next) => {
    const { data: { dishes } = {} } = req.body;
    if (Array.isArray(dishes) && dishes.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Order must include at least one dish`,
    });
}

const quantityPropertyIsValid = (req, res, next) => {
    const { data: { dishes } = {} } = req.body;
    dishes.forEach((dish, index) => {
        if (!dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            return next({
              status: 400,
              message: `Dish ${index} musthave a quantity that is an integer greater than 0`,
          });
        }
    });
    next();
}

const orderExists = (req, res, next) => {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}`,
    });
}

const list = (req, res, next) => {
    res.json({ data: orders })
}

const create = (req, res, next) => {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status ? status : "pending",
        dishes: dishes
    }

    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

const read = (req, res, next) => {
    res.json({ data: res.locals.order });
}

const update = (req, res, next) => {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;
    order.status = status;

    res.json({ data: order });
}

const validateStatus = (req, res, next) => {
    const { orderId } = req.params;
    const { data: { id, status } = {} } = req.body;

    let message;
    if (id && id !== orderId) {
        message = `Order id does not match route id. Order: ${id}, Route: ${orderId}`
    } else if (!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery")) {
        message = "Order must have a status of pending, preparing, out-for-delivery, delivered";
    } else if (status === "delivered") {
        message = "A delivered order cannot be changed"
    }

    if (message) {
        return next({
            status: 400,
            message: message,
        })
    }
    next();
}

const validateDelete = (req, res, next) => {
    if (res.locals.order.status != "pending") {
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending`
        })
    }
    next();
}

const destroy = (req, res, next) => {
    const index = orders.indexOf(res.locals.order);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesPropertyIsValid,
        quantityPropertyIsValid,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesPropertyIsValid,
        quantityPropertyIsValid,
        orderExists,
        validateStatus,
        update
    ],
    delete: [
        orderExists,
        validateDelete,
        destroy
    ]
}