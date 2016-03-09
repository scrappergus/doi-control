var agingDB = new MongoInternals.RemoteCollectionDriver(Meteor.settings.aging_db_url);

DOIBatches = new Mongo.Collection("doibatches");

Articles = new Mongo.Collection("articles", {
	_driver: agingDB
});

Issues = new Mongo.Collection("issues", {
	_driver: agingDB
});
