class CreatePosts < ActiveRecord::Migration[8.0]
  def change
    create_table :posts do |t|
      t.string :title
      t.string :author
      t.datetime :date
      t.string :category
      t.integer :upvote
      t.integer :downvote
      t.boolean :starred
      t.text :content

      t.timestamps
    end
  end
end
