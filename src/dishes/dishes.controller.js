const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
//add handlers and middleware functions to create, read, update, and 
//list dishes. Note that dishes cannot be deleted.

const bodyDataHas = (propertyName) => {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName] && data[propertyName] !== "") {
            return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`
        });
    }
}

const pricePropertyIsValid = (req, res, next) => {
    const { data: { price } = {} } = req.body;
    if (Number.isInteger(price) && price > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Dish must have a price that is an integer greater than 0`,
    });
}

const validateDishId = (req, res, next) => {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;

    if (!id || id === dishId) {
        res.locals.dishId = dishId;
        return next();
    }
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    })
}

const dishExists = (req, res, next) => {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`,
    });
}

const create = (req, res, next) => {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish })
};

const list = (req, res, next) => {
    res.json({ data: dishes })
}

const read = (req, res, next) => {
    res.json({ data: res.locals.dish });
}

const update = (req, res, next) => {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish })
}

module.exports = {
    list,
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        pricePropertyIsValid,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        pricePropertyIsValid,
        validateDishId,
        update
    ]
}