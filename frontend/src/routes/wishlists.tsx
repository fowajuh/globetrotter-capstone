import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Heart, Plus, X, Star, Globe } from "lucide-react";
import { useTravel } from "@/lib/travel-store";
import { listings } from "@/lib/cameroon-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wishlists")({
  component: WishlistsDashboard,
});

function WishlistsDashboard() {
  const { wishlist, toggleWish } = useTravel();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const savedListings = listings.filter((l) => wishlist.includes(l.id));

  // Group them into a single "My Favorites" list for now
  const wishlists = savedListings.length > 0
    ? [{ id: "favorites", name: "My Favorites", items: savedListings }]
    : [];

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="py-6 px-4 sm:px-6 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-display">Wishlists</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 text-sm font-semibold border border-border rounded-full px-4 py-2 hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {wishlists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Create your first wishlist</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              As you explore, tap the ♥ heart on any listing to save your favorite places and build trip shortlists.
            </p>
            <Link to="/">
              <Button size="lg" className="rounded-full px-8">
                <Globe className="w-4 h-4 mr-2" />
                Start exploring
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlists.map((list) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group cursor-pointer"
              >
                {/* Cover mosaic */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-4 shadow-sm">
                  {list.items.length >= 4 ? (
                    <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
                      {list.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="overflow-hidden">
                          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  ) : list.items.length >= 1 ? (
                    <img src={list.items[0].images[0]} alt={list.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : null}
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-full p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 fill-primary text-primary" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{list.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{list.items.length} saved place{list.items.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Saved listings grid */}
            {savedListings.length > 0 && (
              <div className="col-span-full mt-6">
                <h2 className="text-xl font-bold mb-4">Saved places</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {savedListings.map((listing) => (
                    <div key={listing.id} className="relative group">
                      <Link to="/stays/$stayId" params={{ stayId: listing.id }} className="block">
                        <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-muted">
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-sm leading-tight">{listing.city}, {listing.region}</h3>
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 fill-foreground" />
                            {listing.rating.toFixed(2)}
                          </div>
                        </div>
                        <p className="text-sm mt-1"><span className="font-semibold">${listing.usd}</span> <span className="text-muted-foreground">night</span></p>
                      </Link>
                      <button
                        onClick={() => toggleWish(listing.id)}
                        className="absolute top-2 right-2 p-1.5 bg-background/70 backdrop-blur rounded-full shadow-sm hover:scale-110 transition-transform"
                      >
                        <Heart className="w-4 h-4 fill-primary text-primary" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Wishlist Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl shadow-modal p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Name your wishlist</h2>
                <button onClick={() => setIsCreating(false)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder='e.g. "Cameroon Coast Escape"'
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">{newName.length} / 50</p>
              <Button
                className="w-full mt-6 rounded-xl py-6 font-semibold"
                onClick={() => setIsCreating(false)}
                disabled={newName.trim().length === 0}
              >
                Create
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
